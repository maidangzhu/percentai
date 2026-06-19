# Percent 当前状态 + 接下来的修法（2026-06-17）

> 跟产品方向 / 隐私边界 / 架构选型 相关的"非显而易见"事实。**新成员 onboarding 先读这份**。

## TL;DR

| 维度 | 状态 |
|---|---|
| **架构** | Tauri macOS 客户端 + Hono server（3001）+ Next.js CMS（3000）+ Vite landing |
| **数据** | 全部本地 SQLite（`~/.percent-tracker/percent.db`）；截图审计 PNG（`~/.percent-tracker/screenshots/`） |
| **LLM 调用方向** | **server 调**（`apps/server/src/routes/chat.ts`）—— 客户端永远不直连 provider |
| **登录** | 走 Better Auth + Neon（用户的 auth + credit 走云，**聊天 / 截图 / 任务内容不上云**） |
| **当前 blocker** | LLM 调不通：`analyze.request.empty` / `reply.suggest.request.start` 没出现 |
| **当前进度** | 点击卡顿问题已修（capture 异步化），"记任务"UI 入口已删 |

## 1. 现在跑的是哪条产品线

**当前活跃** = **Cloud 模式**（server 转发 LLM + credit 计费）。用户必须登录（Better Auth），所有 LLM 调用走 `POST api.thepercentai.com/chat` → server `routes/chat.ts` → provider。

**已删 / 不可用** = `docs/byok-redesign-*.md` 描述的 BYOK 模式（**别管**）。

## 2. 几条线 + 状态

| 线 | 状态 | 备注 |
|---|---|---|
| 微信按 Enter 留痕 | ✅ 一直 OK | Rust 后台 thread 异步截图，emit `enter-pressed`，前端 listen 不 await |
| 点击「帮我回」不卡 | ✅ 已修 | Rust IPC handler 立即 return metadata（~30ms），后台 thread 跑重活，emit `capture-ready` 携图 |
| 「记任务」UI 入口 | ✅ 已删 | `ActionMenu.tsx` 删 + `captureTaskCandidate` 删；**Enter 路径的自动 task 检测保留** |
| LLM 调用（analyze / suggest） | 🔴 **全断** | `analyze.request.empty`，server `/chat` 返 200 + 空 text |
| 「帮我回」不生效 | 🔴 **LLM 断了所以不生效** | capture 拿到图、suggest 流程没跑、可能 `analyze.request.empty` 同根因 |
| 气泡 click-through 穿透 | 🟡 偶尔出现 | 透明 WebView + IPC hit-regions 同步问题；NSPanel 原生 overlay 是修法，**未做** |
| 「问屏幕」（chat window）| 🟡 还能用但路径杂 | 独立 WebView 窗口，调 server `/agent/model/stream`；user 后续要砍，**未做** |

## 3. LLM blocker 的根因（已查清）

### Env

`apps/server/.env`（关键三项）：

```bash
LLM_BASE_URL=https://api.minimaxi.com/v1
LLM_MODEL_ID=MiniMax-M3
LLM_API_KEY=eyJhbGciOi...   # server 持有
```

### MiniMax-M3 是真实 model

- MiniMax 官方文档：`MiniMax-M3` 是 1M context 最新 M 系列，**支持 text + image + video 多模态**
- 走 OpenAI 协议 `/v1/chat/completions`，用 `image_url` 内容块

### pi-ai 0.75.4 内部不认 MiniMax-M3

`packages/runtime/src/providers.ts:108` minimax preset 默认 model = `MiniMax-Text-01`（**text-only**，**不是** M3）。`packages/runtime/src/providers.ts:115-117` suggestedModels 列表里只有 `MiniMax-Text-01` / `MiniMax-VL-01`，**没有 M3**。

`@earendil-works/pi-ai@0.75.4/dist/models.generated.js:5644-5715` 里 `minimax` 和 `minimax-cn` 两个 known provider：
- 注册的 model 是 `MiniMax-M2.5` / `MiniMax-M2.7`（**没 M3**）
- api 走 `anthropic-messages`，baseUrl 走 `https://api.minimaxi.com/anthropic`（**不是 `/v1`**）
- input 都是 `["text"]`（**pi-ai 内部认为 MiniMax 全是 text-only**）

### percent 当前的代码怎么走

`packages/runtime/src/providers.ts:161-184` `buildProviderModel`：

- preset（`minimax`）：`api: "openai-completions"`，`multimodal: true`（OK，支持图）
- env 覆盖 baseUrl → `https://api.minimaxi.com/v1`（OK，OpenAI 路径）
- env 覆盖 modelId → `MiniMax-M3`（**pi-ai registry 没这条，URL 路由可能 fallback 到 openai 默认**）
- provider 字段：`"minimax"`（来自 preset.id）

pi-ai 0.75.4 看到 `api: "openai-completions"` + `provider: "minimax"` + `baseUrl: https://api.minimaxi.com/v1`，按 OpenAI 协议发请求。**这个组合 MiniMax 兼容**，理论上 work。

**但**：M3 默认开启 thinking，content 里会塞 `` 标签。`routes/chat.ts:196-199` 只 filter `type: "text"` 的 content block，不剥 `` —— 如果 LLM 把 thinking 放在 content 里，filter 出 text 块但 text 字段是空字符串（pi-ai 应该已经把 thinking 剥到单独字段，但**对 M3 不一定对**）。

### 进一步诊断（**已确认**）

`~/.percent-tracker/server-pipeline.log` 最近 log 里**完全没有** `/chat` 请求记录。原因之一是 `apps/server/src/middleware/apiLogger.ts:14` 检查 `c.req.path === "/chat"`，但 Hono mount `app.route("/chat", chatRouter)` 之后内部 path 是 `""` 或 `"/"`，检查永远 false —— 这不是 blocker，但**错误日志路径不完整**。

## 4. 修 LLM 的方案

### 方案 A：直接 fetch 绕过 pi-ai（推荐）

`apps/server/src/routes/chat.ts` 里把 `completeSimple` 调用**直接换成原生 fetch 调 MiniMax OpenAI 端点**：

```ts
const response = await fetch(`${baseUrl}/chat/completions`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
  body: JSON.stringify({
    model: modelId,
    messages: [
      { role: "system", content: system_prompt },
      ...messages,
    ],
    max_completion_tokens: ...,
    // MiniMax-M3 关闭 thinking（避免 content 走 <think> 标签污染）
    thinking: { type: "disabled" },
  }),
});
```

**优点**：
- 完全控制请求体，能传 MiniMax 特有的 `thinking` / `reasoning_split` / `max_completion_tokens`
- 不依赖 pi-ai 对 MiniMax model registry 不熟的问题
- raw response 直接看，错误一目了然
- 代码量 30-50 行，砍掉对 `@earendil-works/pi-ai` 完整 `completeSimple` 的依赖

**代价**：
- 砍掉 server 端对 `anthropic` / `google` 等 preset 的内置支持（如果不用就不要）
- `/agent/model/stream` SSE 端点（chat window 用的）也得改 —— 但 chat window 反正要砍

### 方案 B：加 debug + 改 model 试错

不动 pi-ai，加：
- `/chat/debug` 端点返 effective config
- server 端 `chat.llm_failed` log 加 raw response body
- 试 `MiniMax-M2.7`（pi-ai registry 有，**text-only 不能看图**）+ `MiniMax-VL-01`（多模态但 M2 系列，**可能不够强**）

**优点**：保留 pi-ai 抽象；能快速定位错。
**代价**：调不调得通要看 M2.7 文本模型对 vision 截图的接受度，**不一定 work**。

### 决策

走 **方案 A**。`/agent/model/stream` 跟着改（chat window 是 v2 砍的事，但现在顺手做掉）。`provider` enum 里 `anthropic` / `google` 也保留 preset（Settings UI 还在），但 server 实际只跑 MiniMax 一条线。

## 5. 修完之后还要做的事（按 ROI 排）

| # | 项 | ROI | 状态 |
|---|---|---|---|
| 1 | 修 LLM | 🔴 blocker | **在 plan** |
| 2 | 修「帮我回」生效 | 🔴 LLM 修完应该一起好 | 跟 LLM 同步验 |
| 3 | 删 `docs/byok-redesign-*.md` | 🟢 噪音 | **不删（按 user 要求）** |
| 4 | 规划剩余几条线 | 🟡 写进 plan | 单独 task |
| 5 | 气泡 NSPanel overlay（解穿透）| 🟡 体感 bug | v1.5 |
| 6 | 砍 chat window + `/agent/model/stream` | 🟡 减体积 | 跟 #1 同步做 |
| 7 | 异步 capture 已修 ✅ | — | done |
| 8 | 删「记任务」UI 已做 ✅ | — | done |

## 6. 几条产品/架构决策（写给未来的自己）

- **LLM 永远 server 调**，client 不持 key 不直连 provider
- **用户内容永远本地**（截图 / 聊天 / 联系人 / 任务），云只过 auth + credit
- **M3 multimodal 是核心能力**，不能降级到 M2 text-only
- **capture 走 xcap in-memory**（不 fork 子进程），IPC 立即 return + 后台 emit
- **Enter 路径的 task 检测保留**（自动捞 todo），但菜单「记任务」入口删

## 7. 不知道 / 还要问 user 的事

- `LLM_API_KEY` 在 env 里的实际值（我看不到，但跑方案 A 时不需看 —— server 自有）
- MiniMax-M3 在 OpenAI 协议端点上**是否真有 image input 支持**（官方文档说支持，但要真跑过才能确认 — **plan 是** A 修完跑一次，看 raw response 验证）
- 修完后端点的 credit 扣费是否还要做（现状 `routes/chat.ts` **没**扣 credit —— 跟之前 `lib/credits.ts:168` `chargeForLlmCall` 是分开的，这是个**bug**，但不是 blocker）

---

## 8. 2026-06-18 更新：BYOK 切换完成

**本节覆盖 §1 / §2 / §6 第 1 条**：把架构从 cloud 模式切到 BYOK。

| 维度 | 新状态 |
|---|---|
| **架构** | Tauri macOS 客户端 + Next.js CMS（运营用）+ Vite landing；`apps/server` 保留代码但不跑 |
| **LLM 调用方向** | **client 直连 provider**。WebView 的 CORS 通过 `tauri-plugin-http` 走 Rust 侧 reqwest 绕过 |
| **登录** | **可选、可 skip**。BYOK 是默认模式，没登录也能用（你自己带 provider key 就行） |

**怎么实现**：

1. **`packages/runtime/src/minimaxStream.ts`** — M3 专用 stream 函数。pi-ai 0.75.4 的 `streamOpenAICompletions` 不解析 M3 的 `reasoning_details[]`，percent 在 runtime 写了一个 case-by-case 适配：
   - request body 透传 `reasoning_split: true`（让 M3 把 thinking 拆到 `reasoning_details` 而不是塞 `` 标签）
   - `thinking: { type: "disabled" | "adaptive" }` 按需控制
   - SSE chunk 解析时把 `reasoning_details[].text` 路由到 thinking block，`content` 路由到 text block，`tool_calls` 走标准路径
2. **`apps/client/src/lib/llmFetch.ts`** — `globalThis.fetch = tauriFetch` monkey-patch。pi-ai 内部 OpenAI SDK 通过 `Shims.getDefaultFetch()` 读 `globalThis.fetch`，把这一行替换成 tauri-plugin-http 的 Rust-backed fetch 就解决了 WebView CORS
3. **`apps/client/src-tauri/capabilities/default.json`** — `http:default` permission + 7-8 个 provider baseUrl 的白名单（kimi / openai / deepseek / anthropic / google / minimax / minimaxi + localhost）
4. **client cloud 代码全删**：`lib/auth.ts` / `lib/creditsGate.ts` / `views/AuthView.tsx` 整文件删；`MainWindow.tsx` / `HomeView.tsx` / `SettingsView.tsx` / `AppShell.tsx` / `queries.ts` / `lib/llm.ts` / `bubble/agentRuntime.ts` 全部重写或砍 auth + credit 相关代码
5. **`packages/runtime/src/index.ts` 简化**：删 `streamPercentProxy` 和 proxy 整套，createPercentAgent 只剩 `mode: "direct"`（默认），dispatch 到 `streamMiniMax`（M3）或 pi-ai 内置 `stream()`（其他 provider）
6. **`packages/runtime/src/server.ts` 删**：SSE proxy 实现不再需要
7. **测试**：`packages/runtime/test/minimaxStream.test.ts`（5 个 case：reasoning_details / reasoning_split / disableThinking / no apiKey / tool_calls）+ `buildProviderModel.test.ts`（8 个 case 覆盖所有 provider）；`apps/client/test/llm.test.mts`（6 个 case：callAnalyze / callSuggest / callAgent / no key / isByokConfigured）

**架构决策（替换 §6 旧决策）**：

- **LLM 永远 client 直连 provider**。client 持 key，**不过 server**。要改 provider 时改 `apps/client/src-tauri/capabilities/default.json` 的 URL allowlist
- **用户内容永远本地**（截图 / 聊天 / 联系人 / 任务 / agent 会话），**没有任何数据经过 Percent 控制的服务器**
- **M3 multimodal 是核心能力**（不变）
- **CORS 用 tauri-plugin-http 解**（不是 Rust 转发层）。client 代码无需知道 fetch 被 patch —— 在 `apps/client/src/lib/llm.ts` 顶部 `import "@/lib/llmFetch"` 一次就够
- **provider URL 白名单严格**（7-8 个 baseUrl + localhost）。用户加陌生 provider 要改 capabilities 文件 + 重 build
- **登录页删除**（AuthView.tsx 整个删了）。MainWindow 不再 auth-gate
- **server 代码保留不删**：未来想恢复 cloud 模式可以 `git revert` 当时 PR；当前 dev script (`pnpm dev`) 不再启 server，用 `pnpm dev:server` 显式启
