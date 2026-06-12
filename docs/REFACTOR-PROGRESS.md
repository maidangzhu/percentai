# 重构进展：server 拆 sqlite / Rust Diesel 适配

> 跟 `REFACTOR-SERVER-TO-CLIENT.md` 配套使用——那份是规划，这份是实际进展 + 原因。
> **每完成一个 Stage 在此打勾 + 简记。**

## 整件事的前因后果（不要忘）

1. **最早**：`apps/server` 既跑 auth / credits / LLM 转发，又直接操作本地 SQLite（Log / Person / Task / ChatTurn / agentSession 等用户数据）。本地 dev 没事——server 进程在 Mac 上跑。
2. **搬到 Vercel 后炸**：Vercel serverless 是沙箱，**写不了用户本地 `~/.percent-tracker/percent.db`**——每个请求落到不同的 serverless 实例，且沙箱没 user filesystem。所以 server 上所有 `/logs`、`/people`、`/tasks`、`/agentSessions`、analyze / suggest / agent 这些依赖本地 DB 的路由全 500。
3. **第一次方向调整**（`docs/REFACTOR-SERVER-TO-CLIENT.md`）：把这些数据操作的执行挪到 client（Tauri Mac 端）。Server 只剩 auth + credits。LLM（analyze / suggest / agent）继续走 server 转发（因为 API key 不能放 client）。
4. **commit 4e6e38c**：在 client 装 `prisma` + `better-sqlite3` + `@prisma/adapter-better-sqlite3`，写好 `db/` 目录 + 改写 `lib/queries.ts` / `lib/taskDedup.ts` / `bubble/agentRuntime.ts` / `bubble/useChatWindow.ts`，所有 sqlite 操作都改 Prisma client 调用。**commit message 自己也承认 webview 跑不了 better-sqlite3，挂 Stage 6 TODO**。
5. **现在（2026-06-12 夜）**：跑起来发现气泡不显示。根因：`db/client.ts` 顶层 `import fs from "node:fs"` + 顶层 `ensurePersistentDir()` 触发 Vite 把 `node:fs` externalize 成 browser-shim proxy，**任何调用 throw**。`@prisma/client` 内部 require 了 `better-sqlite3`（Node native module），webview 也加载不了。
6. **当前方案（2026-06-13）**：在 Tauri Rust 端用 **Diesel 2.x + bundled libsqlite3** 操作 SQLite，TS 端走 Tauri command invoke（webview 不再 import 任何 Node-only 模块）。`db/*.ts` 改写成 invoke wrapper。

## Server 端最终目标（待做）

server 只剩 3 件事：
- **Auth**（Better Auth → Neon Postgres）
- **Credits**（查 / 扣）
- **LLM 转发**（接收 client 的 request + byok key，转发给 provider；可选地扣 credits）

其他业务（analyze / suggest / agent / person / task / log / chat_turn 相关的 server route、taskService / peopleMerge / 1181 行 analyze.ts / prompts/ 模板）**全删或全搬 client**。

> 关键原则：**只有经过大模型、auth、credits 时才需要调 server**；其他都是本地 sqlite 操作，不调 server。

## Stage 进度

### Stage 1-5：已完成（commit 3e425e4 → 4e6e38c）
- [x] Prisma schema + types 复制到 client
- [x] `db/client.ts` + `db/paths.ts`（**用 prisma 客户端**——这条路走不通，要改）
- [x] `lib/queries.ts` 全部改本地 Prisma
- [x] `lib/snowflake.ts` 复制
- [x] Server 瘦身为 auth + credits（commit 81410e9）
- [x] `prisma` 装到 client，generators 改到 `src/generated/prisma`（commit 4e6e38c）

### Stage 6：Diesel 适配（Tauri 端跑 sqlite，TS 端走 Tauri command）— **正在做**
- [x] 决策：用 **Diesel 2.2 + bundled libsqlite3**（不依赖系统 libsqlite）
- [x] 写 `apps/client/src-tauri/src/schema.sql`（idempotent CREATE TABLE IF NOT EXISTS）
- [x] 写 `apps/client/src-tauri/src/db/{mod,schema,commands}.rs`
  - [x] 22 个 Tauri command 包装所有 DB 操作
  - [x] `db_get_db_path` 暴露 db 路径给 webview
- [x] `Cargo.toml` 加 diesel + libsqlite3-sys bundled
- [x] `lib.rs` 加 `mod db` + 注册所有 db command + setup 时 `db::init()` 跑 schema
- [ ] **cargo check 跑通**（在跑）
- [ ] 改 `apps/client/src/db/client.ts` —— 不再 import prisma / fs / path，导出所有 db_* invoke wrapper
- [ ] 改 `db/logs.ts` / `db/people.ts` / `db/agentSessions.ts` 调 invoke
- [ ] 改 `lib/queries.ts` 所有 hook 调 invoke
- [ ] 改 `lib/taskDedup.ts` 调 invoke
- [ ] 改 `bubble/agentRuntime.ts` 工具里 prisma 调用换 invoke
- [ ] 删 `db/paths.ts`（不再需要 webview 拼路径）
- [ ] 删 `apps/client/src/generated/` 整个
- [ ] 删 `apps/client/prisma/schema.prisma` + `prisma.config.ts`
- [ ] 删 `apps/client/scripts/db-ensure.mjs`
- [ ] `package.json` 删 prisma / better-sqlite3 / @prisma/* deps + 改 predev/prebuild（去掉 db:ensure）
- [ ] `vite.config.ts` 删 prisma / better-sqlite3 external

### Stage 7：编译 + 验证 ✅
- [x] `pnpm tauri dev` 跑起来
- [x] 右下角气泡显示（webview 加载链无 throw；bubble transparent 窗口定位 `(932, 272)` on monitor 1440x875）
- [x] main window 任务 / 联系人 / 日志 / 统计 渲染
- [x] `~/.percent-tracker/percent.db` 数据保留（Diesel `CREATE TABLE IF NOT EXISTS`）
- [x] **测试 TDD 重写**：client 24/24 + server 33/33 全过
  - `apps/client/test/llm.test.mts` — mock fetch 验证 callChat / callAnalyze / callSuggest 走的 URL + payload（无 api_key / byok）
  - `apps/client/test/taskDedup.test.mts` — dedup 纯函数（same-person 0.4 / cross-person 0.7 阈值 + case-insensitive + whitespace 匹配）
  - `apps/client/test/snowflake.test.mts` — id 唯一性（webview 里 `process` 不存在也能跑）
  - `apps/client/test/agentSystemPrompt.test.mts` — 守 system prompt 关键约束（强制先调工具、不用 emoji、不要幻觉"已记好"）
  - `apps/server/src/routes/chat.test.ts` — mock `@percent/runtime` 的 `completeSimple` / `buildProviderModel`，覆盖 400 / 502 / image 折叠 / provider alias
  - `apps/server/src/routes/agentStream.test.ts` — 验证 SSE `data: ...\n\n` 格式 + provider alias（`moonshotai-cn` → `kimi`）

### Stage 8：server 瘦身 ✅
- [x] **server 删**：`/analyze` / `/suggest` / `/agent` routes + `prompts/` 目录（1181 行 analyze.ts 业务逻辑搬到 client `bubble.tsx runAnalyzePipeline` + `lib/llm.ts` + `lib/prompts.ts`）
- [x] **server 加**：`/chat` 单次转发（system_prompt + messages + image → provider → text response）+ `/agent/stream` 流式转发（SSE 格式给 client runtime 解析）
- [x] **API key 永远在 server**（`LLM_API_KEY` / `KIMI_API_KEY` 等 env），client 永远不传
- [x] **3 个核心路由**：`/api/auth/*`（Better Auth）+ `/credits/*`（Neon Postgres）+ `/chat`、`/agent/stream`（stateless LLM proxy）
- [ ] **server 清理待办**：
  - 删 `apps/server/src/lib/{taskService,peopleMerge,paths,taskDedup}.ts`（server 不再需要）
  - 删 `apps/server/src/routes/{logs,people,tasks,agentSessions,stats}.ts`（已经 404 无路由，源码残留）
  - `apps/server/package.json` 清 dep（`better-sqlite3`、`@prisma/adapter-better-sqlite3`、`ai`、`@earendil-works/*`——保留 `@percent/runtime`）
  - 验证 `vercel --prod` 0 错

## 风险 / 待确认

1. **Diesel 编译时间**：每次 `cargo check` 第一次 ~3-5 min（diesel + libsqlite3-sys bundled 编译），之后增量快。
2. **diesel 2.x BoxableExpression / trait bound**：sql 拼接有时遇到麻烦（filter status 拼接），用 boxed query 解决。
3. **JSON 字段 null**：`screen_context` 等 nullable 字段，TS 端 `null` ↔ Rust `Option<String>` 序列化对得上。
4. **时间字段**：全部 ISO 8601 TEXT 字符串，SQLite 里字符串排序 = 时间排序。
5. **Kimi model id 兼容性**：`kimi-k2.6` 是 multimodal（接受 image），但 pi-ai 0.75 不列 `moonshot-v1-8k-vision-preview`。client 端必须用 `ImageContent`（`{type:"image", data, mimeType}`）格式，**不能**用 OpenAI `image_url`（pi-ai 翻译不识别）。这点 server `/chat` 已自动处理。

## 已知 follow-up（不是 blocker，但需要下一轮做）

- **LLM 幻觉**："今天要干嘛"偶尔**不调工具**直接基于截屏答"已记好"（任务没真写 db）。system prompt 已经写"先调工具再答"，但不是 100% 强制。下一轮：把工具调用前移成 Agent 的必跑步骤，或者 client runtime 检测"用户问任务但 LLM 没调 manage_tasks.list"就 prompt 重做。
- **Tauri webview stale event handler**：dev 中频繁 reload webview 可能报 `listeners[eventId].handlerId undefined`（unhandled promise rejection）。重启 dev 解决；prod build 不触发。
- **task_dedup 阈值**：now same-person 0.4 / cross-person 0.7 沿用老 server analyze.ts。LLM 每次返回 title 微变（"buy milk tomorrow" vs "buy milk by tomorrow"）可能跨阈值。需要实际截屏测看重复弹。
- **UI 卡顿（修了一半）**：`bubble.tsx` 长操作（截图 + LLM）现在包到 `requestAnimationFrame` 后给 progress UI 渲染机会。Rust 端 `capture_current_context` 仍同步跑（macOS `screencapture` 二进制阻塞 Tauri 主线程几百 ms）。下一轮改 `tokio::task::spawn_blocking`。
- **dev log body 打印**：apiLogger 已 redact 响应 body，但请求 body（特别是 `image_base64_chars` 长度）仍打。下一轮把请求 body 也 redact。
- **macOS 14+ transparent bubble 不可见**：截图里看不到（可能 macOS 改了 transparent window 行为）。dev 模式 auto-open devtools 辅助诊断；prod 待验证。

## 历史 commit 索引

- `b2696d6` docs: add refactor plan for moving local SQLite to client
- `8743bb1` refactor(client): add Prisma schema + types (Stage 1 of server-to-client move)
- `3e425e4` refactor(client): copy pure-JS lib helpers (snowflake, logSanitizer)
- `81410e9` wip(server): trim down to auth + credits only
- `4e6e38c` feat(client): add local Prisma + better-sqlite3 layer, convert queries to local DB（**Stage 6 TODO 没做**）
- `33acd82` feat(client): replace Prisma with Diesel in Tauri + bundled libsqlite3（**Stage 6 完成**）
- `1131622` feat(client): rewire queries + LLM business logic against local sqlite + /chat（views + bubble + tests）
- `f17e03d` feat(server): trim to auth + credits + single /chat + /agent/stream endpoints
- `4e55d4e` docs: log Stages 6 / 7 / 8 of the server-to-client refactor
