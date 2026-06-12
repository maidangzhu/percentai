# Refactor: 本地 SQLite 数据层从 server 迁到 client

**日期**: 2026-06-12
**原因**: Vercel server 一直 500,根因不是部署问题,是架构反了。
`apps/server` 里 80% 是用户本地数据逻辑(Log/Person/Task/ChatTurn/agentSessions/analyze/suggest/agent/stats),
这些 100% 应该跑在用户的 Mac 上(client/Tauri),不应该在 Vercel serverless 跑。
之前"能跑"是因为本地 dev 时把 server 进程起在了 Mac 上,它有写 `~/.percent-tracker` 的权限,从来没暴露过问题。

---

## 现状

### `apps/server` (Vercel)

**应该在本地的(用户数据)** — 全部要迁走:

| 文件 / route | 干啥 | 行数 |
|---|---|---|
| `prisma/schema.prisma` | Log / Person / ChatTurn / Task 模型 | ~120 |
| `src/db/client.ts` | Prisma client (SQLite) | ~30 |
| `src/db/init.ts` | SQLite migrations 跑 | ~100 |
| `src/routes/logs.ts` | 增删查聊天日志 | 197 |
| `src/routes/people.ts` | 联系人 CRUD | 125 |
| `src/routes/tasks.ts` + test | 任务 CRUD | 486 |
| `src/routes/agentSessions.ts` + test | agent 会话 | 259 |
| `src/routes/analyze.ts` | LLM 截屏分析(1181 行,巨) | 1181 |
| `src/routes/suggest.ts` | LLM 生成回复建议 | 167 |
| `src/routes/agent.ts` | agent 多轮对话 | 96 |
| `src/routes/stats.ts` | 用户统计 | 60 |
| `src/lib/taskService.ts` | task 业务逻辑 | ? |
| `src/lib/taskDedup.ts` | 已经在 client 端有同名,需合并 | (client 已有) |
| `src/lib/peopleMerge.ts` | 联系人去重 | ? |
| `src/lib/paths.ts` | `~/.percent-tracker` 路径 | 13 |
| `src/lib/credits.ts` | 积分逻辑 | ? |
| `src/prompts/` | LLM prompt 模板 | ? |

**真正上云的(保留)**:

| 文件 | 干啥 |
|---|---|
| `prisma-auth/schema.prisma` | User / Session / Account (Better Auth) |
| `prisma-auth.config.ts` | Better Auth 的 Prisma config |
| `src/auth/db.ts` | auth 用的 Prisma client(Neon) |
| `src/auth/index.ts` | Better Auth handler |
| `src/middleware/authGuard.ts` | 鉴权中间件 |
| `src/middleware/responseGateway.ts` | 响应包装 |
| `src/middleware/apiLogger.ts` | API 日志 |
| `src/routes/credits.ts` | 积分查询 / 扣减 |

### `apps/client` (Tauri,跑在用户 Mac 上)

**应该有但目前没有**:
- 本地 SQLite 数据层(目前所有数据都通过 fetch 调 server)
- `prisma/schema.prisma` 和 migrations
- `db/` 目录
- BYOK LLM 直连(目前通过 server 代理,BYOK 设计本意是 client 直连)

**已经在用 `fetch(\`${API_BASE}/...\`) 调 server 的地方** — 全部要改成本地 Prisma / BYOK 直连:
- `src/lib/queries.ts`(React Query 全部 hooks)
- `src/bubble/agentRuntime.ts`(agent 多轮对话)
- `src/bubble/useChatWindow.ts`
- `src/views/PeopleView.tsx`, `LogsView.tsx`, `SettingsView.tsx`
- 其他引用 `API_BASE` 的地方

---

## 目标架构

### `apps/server` (Vercel) — 只剩 auth + credits

```ts
// 端点
POST   /api/auth/*                // Better Auth (Neon/Postgres)
GET    /credits/balance/:userId
POST   /credits/deduct
// 没了。
```

### `apps/client` (Tauri Mac) — 全部本地操作 + BYOK LLM

```ts
// 本地 SQLite (Prisma + better-sqlite3)
prisma.log.create(...)
prisma.person.findMany(...)
prisma.task.findMany(...)
prisma.chatTurn.findMany(...)
prisma.agentSession.findMany(...)

// BYOK LLM 直连 (client 直接 fetch provider)
const openai = new OpenAI({ apiKey: byokKey, baseURL: provider.baseUrl })
const completion = await openai.chat.completions.create({ ... })
```

### `apps/cms` (运营内部) — 不变
只读 Neon(读 auth + credits),不碰本地 SQLite。架构 OK。

### `apps/landing` (Vite) — 不变
纯静态,不碰 DB。

---

## 迁移 TODO(边做边打勾)

### Stage 0 — 准备(已完成)
- [x] 写本规划文档
- [x] 确认 client 当前零本地 DB、零 prisma

### Stage 1 — schema + prisma 类型生成 到 client ✅
- [x] `apps/client/prisma/schema.prisma` 复制 (140 行)
- [x] `apps/client/prisma.config.ts` 复制
- [x] (migrations 目录不存在 — server 用 `prisma db push` 不维护 migration)
- [x] `apps/client/package.json` 加 prisma devDep + @prisma/client dep
- [x] `apps/client/package.json` 加 `prisma:generate` / `prisma:db:push` scripts
- [x] `pnpm install` + `pnpm prisma:generate` 跑通,Prisma client 7.8.0 生成
- [x] **commit**: `fe0c...` (Stage 1 完成)

**注意**: Prisma 运行时(`@prisma/client` + `better-sqlite3`)不能直接跑在 Tauri 2 webview 里(webview 沙箱,没有 Node.js fs/原生模块)。所以 **Stage 1 只是把 schema + 类型基建搬过去**,**不搬运行时 Prisma client**。运行时 DB 操作走 Stage 6 的 Tauri plugin / commands。

### Stage 2 — 业务 lib 移到 client
- [ ] `apps/client/src/lib/taskService.ts` 从 server 复制
- [ ] `apps/client/src/lib/peopleMerge.ts` 从 server 复制
- [ ] `apps/client/src/lib/snowflake.ts` 从 server 复制
- [ ] `apps/client/src/lib/taskDedup.ts` 已存在,需要 review + 改成读本地 DB
- [ ] server 端 `lib/taskService.ts` / `lib/peopleMerge.ts` / `lib/snowflake.ts` 暂时留着(后面再删)

### Stage 3 — 客户端的 fetch 调用改本地
- [ ] `apps/client/src/lib/queries.ts` 全部 React Query hooks 改成本地 Prisma
  - `useLogsQuery` → 直接 prisma.log.findMany
  - `usePeopleQuery` → 直接 prisma.person.findMany
  - `useTasksQuery` → 直接 prisma.task.findMany
  - `useCreditsBalance` → 还是 fetch(这个走云)
  - `useStats` → 直接 prisma
- [ ] `apps/client/src/bubble/agentRuntime.ts` 移除对 `API_BASE` 的依赖,改成本地 prisma + BYOK fetch

### Stage 4 — LLM routes 移到 client(BYOK 直连)
- [ ] `apps/client/src/lib/llm.ts` 新建(从 server 的 analyze.ts / suggest.ts / agent.ts 抽取 LLM 逻辑)
- [ ] 用 BYOK key 直接调 provider
- [ ] server 端 `analyze.ts` / `suggest.ts` / `agent.ts` 暂时留着
- [ ] client 端 bubble 代码用新 `llm.ts`

### Stage 5 — 删 server 端迁移完的代码
- [ ] 删 `apps/server/prisma/schema.prisma` 和 migrations
- [ ] 删 `apps/server/src/db/`
- [ ] 删 `apps/server/src/lib/taskService.ts` / `taskDedup.ts` / `peopleMerge.ts` / `snowflake.ts` / `paths.ts` / `credits.ts`(credits 业务保留,只是搬家)
- [ ] 删 `apps/server/src/routes/logs.ts` / `people.ts` / `tasks.ts` / `agentSessions.ts` / `stats.ts` / `analyze.ts` / `suggest.ts` / `agent.ts` + 相关 test
- [ ] 删 `apps/server/src/prompts/`(如果只在 LLM routes 用了)
- [ ] 更新 `apps/server/package.json`,删掉不再用的 dep(better-sqlite3, @prisma/adapter-better-sqlite3, ai SDK, @earendil-works/*, @hono/node-server 等可能不需要)
- [ ] 更新 `apps/server/src/app.ts` 删路由 import

### Stage 6 — Tauri 适配
- [ ] **Tauri 2 webview 是沙箱的**,JS 不能直接用 `fs` / `better-sqlite3`。
- [ ] 需要走 Tauri commands(Rust 侧)做 SQLite 操作,或者用 `tauri-plugin-sql`。
- [ ] 调研:`@tauri-apps/plugin-sql` 是否能直接 Prisma 生成?
  - 如果不能:Rust 侧写一套 rusqlite + 命令,client 用 typed wrapper
  - 如果能:直接用
- [ ] 决定后实施

### Stage 7 — 部署 + 验证
- [ ] `pnpm dev` 跑通 client (本地 dev 体验应该 = 之前)
- [ ] `pnpm tauri:dev` 跑通 Tauri 客户端
- [ ] 重新打 Tauri .dmg(包含新的本地 DB)
- [ ] `vercel --prod` 重新部署 server(只含 auth + credits,这次应该 0 错)
- [ ] curl https://api.thepercentai.com/ 验证(可能 404,但不该 500)
- [ ] curl https://api.thepercentai.com/api/auth/get-session 验证(auth 通)

---

## 风险 / 待确认

1. **Tauri 2 webview 用 better-sqlite3 / Prisma 是否可行?**
   之前 client 是纯 webview,没试过在 webview 里跑 Node-only 包。
   如果不可行,需要 Tauri commands(Rust 侧),这是大额外工作量。
   **建议先调研 `tauri-plugin-sql` 或 `wasm-sqlite` 这类方案。**

2. **LLM 1181 行的 analyze.ts 怎么拆?**
   直接复制粘贴太烂,需要按职责拆成多个函数(analyzeScreenshot / detectTask / suggestReply / etc.)。

3. **server 瘦身后,package.json 要清掉很多 dep。**
   `ai`、`@ai-sdk/openai-compatible`、`@earendil-works/*` 这些是 LLM 用的,迁走后可以删。
   但要确认 server 真的不依赖它们。

4. **dev 体验会不会退化?**
   之前 `pnpm dev` 起 server,server 有完整业务。
   之后 dev 体验 = 之前 + 多了一步 prisma generate,应该问题不大。

5. **测试怎么办?**
   server 那边有 test 文件(`tasks.test.ts` 等),迁走后要带到 client 端,改成本地 Prisma 测试。
   client 端目前没什么测试基建,要先看 `apps/client` 有没有 vitest / jest 之类的。

---

## 进度

(每完成一项在这里打勾 + 在 commit message 里 reference 本 doc)
