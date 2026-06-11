# Percent 三条产品线流程

> 截至 2026-06-06。当前只走截屏路径（a11y tree / OCR 已去除）。

## 总览

三条线（问屏幕 / 帮我回 / 记任务）共享同一段"截屏 → 落日志 → server 抽 chat"的基础管线，分叉点在 server 返回的 `result` 之后。

```
┌─────────── Tauri (Rust) ───────────┐    ┌────────── Hono server ─────────┐    ┌── Neon (Better Auth) ──┐
│ keyboard 监听 (device_query)       │    │ POST /logs  (写本地 SQLite)    │    │ User / Session / …     │
│ capture_current_context            │    │ POST /analyze (LLM 抽 chat)   │    └────────────────────────┘
│ capture_screen_without_bubble      │    │   ├─ callKimi (kimi-k2.6)     │
│ read_file_base64                   │ ─► │   ├─ resolveCanonicalPerson   │ ─► ┌─ 本地 SQLite ────────┐
│ append_bubble_log                  │    │   ├─ chatTurn.create          │    │ logs / people /      │
│ frontapp (osascript + System Evts) │    │   └─ detectTaskCandidate      │    │ chat_turns / tasks /  │
└────────────────────────────────────┘    │ POST /suggest  (生成回复)      │    │ agent_sessions / …   │
                                          │ POST /tasks/confirm           │    └─────────────────────┘
                                          │ POST /agent/sessions/...      │
                                          │ POST /agent/model/stream      │ ─► Moonshot (kimi-k2.6,
                                          │   (server-proxy 路径)         │     BYOK 时 client 直连)
                                          └────────────────────────────────┘
```

---

## 1. 问屏幕 (Ask the screen / Agent)

让 AI 读当前屏幕 + 用户一句话，用工具（找人、查聊天、记任务、起草回复）持续多轮回答。

### 入口
- UI：`bubble/ActionMenu.tsx:34-40` "Ask the screen" → `onAction("agent")`
- 处理：`bubble.tsx:1531-1546 handleActionMenu` → `bubble.tsx:1067 openAgentPanel`
- `openAgentPanel` 打开 `ChatPanel`（`bubble/ChatPanel.tsx`）

### 会话生命周期
1. 首次打开：`bubble.tsx:1073-1080` → `createNewSession` 调 `POST /agent/sessions`（`apps/server/src/routes/agentSessions.ts:34-41`）→ 拿到 `session_id` 写 `localStorage["percent.agentSessionId"]`
2. 后续打开：`loadSession(currentSessionId)` → `GET /agent/sessions/:id`（`agentSessions.ts:43-51`）→ 拉历史 messages
3. 删除：`DELETE /agent/sessions/:id`（`agentSessions.ts:67-75`）

### 发消息（核心）
入口：`bubble.tsx:1096 sendAgentMessage(text)`

| 步骤 | 调用 | 文件 |
|------|------|------|
| 1. 截屏 | `captureAgentScreenContext()` → Tauri `capture_current_context` → 读 `screenshot_path` → `read_file_base64` | `bubble.tsx:924-933` |
| 2. 组 payload | `createAgentPrompt(text, screenContext)` 把图片塞 user message 里 | `bubble.tsx:80-86` + `agentRuntime.ts:80+` |
| 3. 建 agent | `createPercentAgent` + 8 个 tool | `packages/runtime/src/index.ts:47+` |
| 4. 订阅事件 | `agent.subscribe(...)` 处理 `message_update` / `tool_execution_*` / `message_end` | `bubble.tsx:1193-1337` |
| 5. 推 prompt | `agent.prompt(...)` 触发 stream | `bubble.tsx:1415` |
| 6. 持久化 | `POST /agent/sessions/:id/messages/batch`（fire-and-forget） | `bubble.tsx:1144-1191` + `agentSessions.ts:77-111` |

### 流式链路
- 客户端 agent 的 stream 不走直连 Moonshot，而是先到 server 代理：`POST /agent/model/stream`（`apps/server/src/routes/agent.ts:15-96`）→ server 调 `createPercentProxyResponse`（`packages/runtime/src/server.ts`）→ 转发到 Moonshot
- 事件类型：`thinking_start/delta` / `text_start/delta/end` / `toolcall_start/end` / `tool_execution_start/end` / `message_end`
- `message_end` 拿 usage → server 扣 `credits`（`routes/agent.ts:56-93`）

### 工具（agentRuntime.ts）

6 个 tool，agent 按需调。前 4 个走 server REST API，后 2 个是**客户端工具**（Tauri 直跑）：

| tool | 路径 | 说明 |
|------|------|------|
| `manage_people` | server | 本地联系人。action=list/get |
| `manage_chats` | server | 聊天消息。action=list/search |
| `manage_tasks` | server | 任务 CRUD。action=list/get/create/update/delete |
| `manage_logs` | server | 截屏元数据。action=list |
| `run_bash` | **client (Tauri)** | 在用户 Mac 跑 bash 命令。**需用户审批**（见下） |
| `read_file` | **client (Tauri)** | 读 `~/` 下文件。Tauri 端做路径白名单 |

### 客户端工具的审批模型（run_bash）

`run_bash` 是高风险工具：截图里的 prompt injection 即可触发任意命令。安全策略：

- **首次手动批准**：Agent 每次调 `run_bash`，UI 弹一个内联审批卡（在 chat 列表底部），展示完整 cmd 字符串
- **同 session 内自动放行**：用户批准过的 cmd（exact match: cmd + cwd）在 `bubble.tsx` 的 `approvedCommandsRef`（`Set<string>`，按 `{cmd, cwd}` JSON key 索引）里。同 session 再调同一条不再问
- **新 session 重置**：`currentSessionId` 变时（切换/新建 session）清空 set
- **4 个按钮**：
  - **Approve**（白底黑字）→ resolve `{approved: true}`，记入 set
  - **本轮允许**（带边框的高亮）→ resolve `{approved: true, approveForTurn: true}`，记入 set + 设 `turnAllowedRef.current = true`；本轮（一个 user message 触发的 agent 循环）内所有 bash 不再问
  - **Edit** → 弹 textarea 让用户改 cmd / cwd，resolve `{approved: true, editedArgs}`；改后的 cmd 也会入 set
  - **Deny** → resolve `{approved: false}`，工具返回 `{error: "User denied..."}` 给 agent
- **本轮（turn）生命周期**：`turnAllowedRef`（`{current: boolean}` ref）在每个 `sendAgentMessage` 开头重置为 false；用户点"本轮允许"后设 true。bash tool execute 入口先检查 `turnAllowedRef.current || approvedCommands.has(key)`，任一为真就跳过审批
- **超时保护**：`run_bash` 默认 30s timeout（最多 120s），超 32KB 输出截断（`truncated=true`），主进程 kill 子进程

### 客户端工具的路径白名单（read_file）

- Tauri 端（`shell_tools.rs:read_local_file`）做 `canonicalize` + `starts_with(home_dir)` 校验
- 任何不在 `~/` 下的路径（`/etc` / `/private` / `/System` 等）直接 `Err("path ... is outside ~/"）`
- `max_bytes` 默认 256KB，上限 4MB；超出会截断
- 文本按 utf8 返回；二进制回 base64 + `encoding: "base64"`

### 客户端工具的 Tauri 命令

- `apps/client/src-tauri/src/shell_tools.rs` — `run_bash` + `read_local_file` 两条命令
- 注册在 `apps/client/src-tauri/src/lib.rs` 的 `invoke_handler!` 宏
- 每次调用 `eprintln!` 一行 `[shell_tools] run_bash start cmd=...`，dev 模式回流 pnpm 终端

### 关键文件
- `apps/client/src/bubble.tsx:1067-1438`（含 `approvedCommandsRef` / `pendingApproval` 审批状态）
- `apps/client/src/bubble/ChatPanel.tsx`（含 `ApprovalCard` 内联审批卡）
- `apps/client/src/bubble/agentRuntime.ts`（system prompt + 6 个 tool + 审批钩子）
- `apps/client/src-tauri/src/shell_tools.rs`（`run_bash` + `read_local_file` 两条 Tauri command）
- `apps/server/src/routes/agent.ts`（流式代理；BYOK 时不走这条）
- `apps/server/src/routes/agentSessions.ts`（会话 CRUD）
- `apps/server/src/agents/agentSessionStore.ts`（**本地 SQLite** 持久化）
- `packages/runtime/src/index.ts`（agent core）
- `packages/runtime/src/server.ts`（server proxy，BYOK 时用 direct 流）

---

## 2. 帮我回 (Draft a reply)

基于当前屏幕 + 该联系人历史 chat，让 LLM 生成 3 条风格化回复建议，自动复制第 1 条到剪贴板。

### 入口
- UI：`bubble/ActionMenu.tsx:41-47` "Draft a reply" → `onAction("reply")`
- 处理：`bubble.tsx:1536-1537` → `bubble.tsx:765 generateReplySuggestion`

### 流程
| 步骤 | 调用 | 文件 |
|------|------|------|
| 1. 截屏 + 落日志 | `captureAndAnalyze()` → `runAnalyzePipeline({forceAnalyze:true, detectTask:false})` | `bubble.tsx:739-763` |
| 2. 跑分析 | server `POST /analyze` (image_base64) → `callKimi` → 拿到 `person_id` | `apps/server/src/routes/analyze.ts:228+` |
| 3. 生成建议 | `POST /suggest {person_id, style:"cautious"}` | `apps/server/src/routes/suggest.ts:31-166` |
| 4. 写剪贴板 | `writeText(suggestion)` (Tauri clipboard plugin) | `bubble.tsx:847-852` |
| 5. 弹窗 | 显示 `SuggestionPopover` "Reply copied" | `bubble/SidePopover.tsx` |

### server `/suggest` 内部
- 拉该 `person` 的所有 `chat_turns`（`routes/suggest.ts:52-56`）
- `mergeOverlappingChatTurns` 去重 / 拼接（`lib/chatMerge.ts`）
- 按 `style` 选 system prompt（4 种：`chat_master` / `cautious` / `flirty` / `icebreaker`）
- 调 `callChat` 走 `toolChoice: "reply_suggestions"` 强结构化返回 3 条建议
- 当前 bubble 写死用 `style: "cautious"`

### 关键文件
- `apps/client/src/bubble.tsx:765-869`
- `apps/server/src/routes/suggest.ts`
- `apps/server/src/prompts/suggest-*.system.ts`

---

## 3. 记任务 (Capture task)

从当前屏幕 + 最近聊天识别出隐含待办，弹气泡让用户确认，确认后写 `tasks` 表 + 可选加 macOS Calendar。

### 入口
- UI：`bubble/ActionMenu.tsx:48-54` "Capture task" → `onAction("task")`
- 处理：`bubble.tsx:1539-1540` → `bubble.tsx:871 captureTaskCandidate`

### 流程
| 步骤 | 调用 | 文件 |
|------|------|------|
| 1. 截屏 + 落日志 | `captureAndAnalyze({detectTask:true})` → `runAnalyzePipeline` | `bubble.tsx:871-881` |
| 2. server 抽 chat + 探测 task | `POST /analyze` → `callKimi` 拿 messages → `detectTaskCandidate` | `routes/analyze.ts:228+` + `lib/taskDetector.ts` |
| 3. dedup 抑制 | 客户端 `isExistingTaskCandidate` 比已有 pending 任务 | `apps/client/src/lib/taskDedup.ts` |
| 4. 弹确认气泡 | `TaskConfirmPopover` | `bubble/SidePopover.tsx:5-90+` |
| 5. 用户点 Confirm | `bubble.tsx:549 confirmTask(candidate)` | `bubble.tsx:549-606` |
| 6. 写库 | `POST /tasks/confirm` → `createOrFindTask` | `routes/tasks.ts:66-112` + `lib/taskService.ts` |
| 7. 加 Calendar（可选） | Tauri `add_task_to_calendar` → AppleScript → macOS Calendar | `lib.rs:321-387` + `lib/calendar.ts` |
| 8. 通知主窗口刷新 | Tauri `emit_tasks_updated` → MainWindow 重新拉 `tasks` | `lib.rs:293-296` |

### server `detectTaskCandidate` 内部
- 输入：existing messages + new messages
- 调 LLM（`prompts/task-detector.system.ts`）判断是否有 to-do
- 命中 → 返回 `{title, person_name, due_at, evidence, fingerprint, raw_ai_response}`
- `due_at` 是 ISO 字符串；`fingerprint` 用来客户端 dedup

### 客户端 dedup（双层）
- **客户端 dedup**（`bubble.tsx:386-419` + `lib/taskDedup.ts`）：同人在 `taskTitleSimilarity ≥ 0.4`，或跨人 `≥ 0.7` → 抑制 popover，改弹"Already on your list"
- **服务端 dedup**（`taskService.ts`）：写库前 `findDuplicateTask` 强约束（标题相同 / 同人同日相似）

### 自动确认
- 开关：`localStorage["percent.task.autoCreateOnCountdown"]`（Settings → Task capture）
- 打开后 `TaskConfirmPopover` 显示 6.5s 倒计时，结束自动 `confirmTask`

### 关键文件
- `apps/client/src/bubble.tsx:871-922`, `:549-606`
- `apps/client/src/bubble/SidePopover.tsx:5-90`
- `apps/client/src/lib/taskDedup.ts`
- `apps/client/src/lib/calendar.ts`
- `apps/server/src/lib/taskDetector.ts`
- `apps/server/src/lib/taskService.ts`
- `apps/server/src/routes/tasks.ts`
- `apps/server/src/prompts/task-detector.{system,user}.ts`

---

## 共享基础设施

### 截屏（核心，Tauri 层）
- `capture_current_context` (Tauri command, `lib.rs:180-201`)
  - 拿前台 app：`frontapp::get_frontmost_app()` → osascript `tell application "System Events"`（**这条要 a11y 权限**）
  - 算 `is_send` / `is_wechat`：`frontapp::is_send_action` 按 bundle_id + name 匹配常见 IM（`frontapp.rs:48-86`）
  - 截图：`screenshotter::capture_screen_without_bubble` 排除 bubble 窗口本身（macOS `screencapture`）
- 截图路径：`~/.percent-tracker/screenshots/{ts}.png`
- base64：`read_file_base64`（`lib.rs:215-222`）

### `runAnalyzePipeline`（bubble.tsx:131-401）
所有"按 Enter"和 "Draft a reply" / "Capture task" 都走的公共管线：
1. `POST /logs` 写本地 SQLite（`bubble.tsx:166-200`，`routes/logs.ts`）
2. 读 `screenshot_path` → `read_file_base64` → imageBase64
3. `POST /analyze {log_id, occurred_at, app_name, image_base64, detect_task}`（`routes/analyze.ts`）
4. server 跑 `callKimi` 拿 chat（多模态 LLM，必走 kimi-k2.6 tool_choice=record_chat_session）
5. server `resolveCanonicalPerson` 匹配/创建 person（`lib/peopleMerge.ts`）
6. server `chatTurn.create` + `getNewMessagesFromSnapshot` 去重（`lib/chatMerge.ts`）
7. server（可选）`detectTaskCandidate` 出 task_candidate
8. 客户端拿到结果：reply 走 `/suggest`、task 弹 confirm popover、Enter 走 `report_ai_result` 回写 log

### 日志链路
- 客户端 logger（`lib/logger.ts`）：结构化 JSON 行 → `console.*` + 异步 `invoke("append_bubble_log", {line})`
- Tauri 落盘：`append_bubble_log`（`lib.rs:242-264`）→ `~/.percent-tracker/bubble-pipeline.log`
- server logger（`lib/appLogger.ts`）：JSON 行 → `console.*` + 落盘 `~/.percent-tracker/server-pipeline.log`
- 每个 request 都有 `trace_id`，跨端可串

### 持久化边界
- **本地 SQLite**（better-sqlite3，`db/client.ts`）：`logs` / `people` / `chat_turns` / `chat_messages` / `tasks` + `agent_sessions` / `agent_messages`（agent 多轮对话）
- **Neon PostgreSQL**（Prisma，`auth/`）：`User` / `Session` / `Account` / `Verification` + `UserCredit` / `CreditTransaction`（仅账号 + 积分；**业务聊天数据全部不上云**）
- **CMS 只读 Neon**（账号、积分、流水）；不读本地 SQLite，不看用户聊天/任务/agent 对话内容

### 键盘监听
- `keyboard.rs:63-89`：独立线程用 `device_query` 20ms 轮询，匹配用户配置的 shortcut（默认 Enter）
- 命中 → `handle_enter_pressed`（`keyboard.rs:173-247`）：
  1. 拿 front app
  2. 写本地 `log_store`
  3. 若 wechat + 截图开关开 → 截屏（异步线程）→ emit `enter-pressed` 事件
  4. emit `count-updated`
- 需要 macOS **Input Monitoring** 权限（device_query 监听全局按键）

---

## 本地文件布局（`~/.percent-tracker/`）

> 路径可用 `PERCENT_HOME` 覆盖（默认 `~/.percent-tracker`）。  
> SQLite 路径可再用 `PERCENT_DATABASE_PATH` 覆盖。

| 文件/目录 | 大小量级 | 写者 | 内容 | 清理 |
|----------|---------|------|------|------|
| `percent.db` | ~30 MB | server (Prisma + better-sqlite3) | 业务 SQLite（5 张表）：`logs` / `people` / `chat_turns` / `chat_messages` / `tasks`（schema 见 `apps/server/src/db/init.ts:194-279`） | "Clear cache" 会 server 端 `DELETE` 所有行 + client 清缓存 |
| `percent.db-shm` | ~32 KB | SQLite 自动 | WAL 模式共享内存文件 | 不动 |
| `percent.db-wal` | 几 MB | SQLite 自动 | WAL 模式 write-ahead log，事务提交后自动 checkpoint | 不动 |
| `enter-log.txt` | 几 KB ~ 几十 KB | Tauri `logger.rs:51-79` | 每次 Enter 追加一行：`[ts] SEND\|NEWLINE \| app_name (bundle_id) \| entry_id` | "Clear cache" 删 |
| `ai-result.txt` | 几 KB | Tauri `logger.rs:82-93` | AI 跑完一条回写一行：`[entry #N] 与 X 聊天 \| 主题：Y`（非聊天场景写"非聊天场景"） | "Clear cache" 删 |
| `bubble-pipeline.log` | 几十 KB ~ 几 MB | Tauri `append_bubble_log` (`lib.rs:242-264`) ← 客户端 `lib/logger.ts` | 客户端结构化 JSON 日志（`ts/level/event/trace_id/...`），覆盖 Enter 触发的 8 步 pipeline（`pipeline.start` / `screenshot.read.success` / `analyze.request.success` / ...）和 agent 跑 | 不自动清；想清直接 `rm` |
| `server-pipeline.log` | 几百 KB ~ 几 MB | server `appLogger.ts:appendToFile` | server 结构化 JSON 日志，覆盖 `prisma.query` / `http.request` / `analyze.*` / `tasks.*` 等 | 不自动清；想清直接 `rm` |
| `screenshots/` | 几百 ~ 几千 个 PNG | Tauri `screenshotter::capture_screen`（macOS `screencapture -x -t png`） | 每次 Enter 触发截屏，文件名 `screenshot_YYYY-MM-DD_HH-MM-SS-mmm.png`。被 server `/analyze` 读 base64 用 | "Clear cache" 删目录下所有文件 |
| `settings.json` | < 100 字节 | Tauri `lib.rs:55-67` | JSON 格式 `{"key": "Enter", "modifiers": ["Command"]}`，用户在 Settings → Capture shortcut 改的快捷键 | 不自动清 |

**Snowflake ID**：`logs` / `people` / `chat_turns` / `chat_messages` / `tasks` 的 `id` 全是文本 snowflake（`lib/snowflake.ts`），不是自增 int。

**`logs` vs `enter-log.txt` 的区别**：
- `logs` 表（SQLite）：完整 schema，每次 Enter / Draft a reply / Capture task 都插一条；server `/logs` API 读它给主窗口 Logs 页用
- `enter-log.txt`：纯文本平铺日志，只记 Enter 事件 + entry_id，方便 grep

**`bubble-pipeline.log` vs `server-pipeline.log`**：
- 前者记客户端（bubble）发起的 pipeline（截屏读 / analyze 请求 / dedup 决策 / 写库结果 / 后续 agent 事件）
- 后者记 server 处理（Prisma 查询 / LLM 调用 / HTTP 请求响应）
- 同一个请求会带相同 `trace_id`，可以 grep 串起来

**Settings 里的其他 localStorage 状态**（不在 `~/.percent-tracker/` 下，在浏览器 localStorage，绑在 bubble 窗口）：
- `percent.welcomed` — Welcome 页是否过了
- `percent.agentSessionId` — 当前 agent 会话 id
- `percent.task.autoCreateOnCountdown` — 任务自动确认开关
- `percent.calendar.autoAdd` — 任务加 calendar 开关
- `percent.byok` — BYOK 配置 JSON：`{enabled, provider, model, baseUrl, apiKeyEncrypted}`（key 用 Web Crypto 加密）

**截图和日志的留存**：当前没有内置轮转，磁盘会持续涨。"Clear cache" 只清 `enter-log.txt` / `ai-result.txt` / `screenshots/`，**不会动** `*.log` 和 `percent.db`。

---

## 4. BYOK (Bring Your Own Key)

> 已实现（`33ffa75 feat(byok): client-direct multi-provider mode with settings UI`）。

让用户用自己的 LLM API key 跑 agent 多轮对话。设计原则：

- **key 不上服务端**：API key 存在 Tauri 0600 文件 `~/.percent-tracker/byok.key`（通过 `save_byok_key` / `get_byok_key` / `clear_byok_key` 命令读写）；非秘密字段（provider / modelId / modelName / baseUrl）放 browser localStorage
- **不走 server 转发**：BYOK 路径下 `createPercentAgent` 用 `mode: "direct"`，client 直接调 `streamPercentDirect` 发 provider HTTPS 请求；`/agent/model/stream` 完全不触发，server 看不到 LLM 调用，**不扣 credits**
- **仍然要求登录**：账号体系 + 积分 + 跨端使用事件仍要服务端有记录（BYOK 用户不扣积分但应记录"用了哪个 provider 多少 token"）
- **Agent 多轮对话仍存本地 SQLite**：`agent_sessions` / `agent_messages` 表不受 BYOK 影响

**实现位置**：
- `packages/runtime/src/index.ts:355-360` — `createPercentAgent` 根据 `mode` 选 streamFn（`direct` 用 `streamPercentDirect`，`proxy` 走 server）
- `packages/runtime/src/index.ts:391+` — `streamPercentDirect`，按 provider 直连
- `apps/client/src/lib/byokConfig.ts` — BYOK 配置存储（key 入 Tauri 文件，其他字段入 localStorage）
- `apps/client/src/views/SettingsView.tsx` — BYOK 设置 UI（`ByokSettings` 子组件）
- `apps/client/src/bubble/agentRuntime.ts` — 选 direct vs proxy
