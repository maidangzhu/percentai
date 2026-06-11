# Percent

> macOS 微信 AI 伙伴。本地优先，不替你做决定。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Platform: macOS](https://img.shields.io/badge/Platform-macOS-blue.svg)](#)
[![Stack: Tauri 2](https://img.shields.io/badge/Stack-Tauri%202-orange.svg)](#)

微信里按 Enter，这条对话自动存下来 — 不切窗口、不截图、不点按钮。
截个屏，它读上下文、生成得体的回复，⌘V 直接发（永远不替你发）。
淹没在对话里的"明天下午你过来看看"自动捞出来，弹给你确认再写库。
"上次答应过这个客户什么事" — 截个屏一句话问它，它翻你本地记录再答你。

聊天记录、任务、联系人全在本地 SQLite（`~/.percent-tracker/percent.db`），不上云。
账号体系走 Better Auth（Neon），但**不存聊天内容**。

[官网](https://thepercentai.com) · [Privacy Policy](PRIVACY.md) · [Terms of Service](TERMS.md)

---

## 核心功能

- **按 Enter 自动留痕** — 微信里按回车，这条对话自动存下来。想翻"上周和谁聊过什么"不用滚聊天记录。
- **帮我回** — 截个屏，它读上下文，生成得体的回复，⌘V 直接发。**永远不自动发送**，粘贴前你能看见、能改。
- **记任务** — "明天下午你过来看看"、"回头把资料发我" — 这种隐性 todo 自动捞出来，弹确认后再写库；可选同步到 macOS Calendar。
- **问屏幕** — "这个人是谁"、"上次答应过这个客户什么事" — 截个屏一句话问它，它用工具（找人、查聊天、记任务、起草回复）持续多轮回答。

---

## 为什么不一样

| | Percent | 截图+OCR 类工具 | 云端 IM 助手 |
|---|---------|----------------|-------------|
| 聊天内容 | **本地 SQLite，不上云** | 通常本地 | 几乎一定上云 |
| 回复 | **永远是建议**，你 ⌘V 粘贴 | 不生成回复 | 部分自动发送 |
| LLM key | **可以用自己的（BYOK）**，client 直连 provider | 绑死厂商 | 绑死厂商 |
| 离线 | 主功能完全离线 | 部分 | 不行 |

BYOK (Bring Your Own Key) 用 Web Crypto 不行 — 我们用 Tauri 0600 文件存你的 key，连 localStorage 都不进。

---

## 架构

```
┌────────── Tauri (Rust) ──────────┐    ┌────────── Hono server ─────────┐
│ keyboard 监听 (device_query)      │    │ POST /logs                      │
│ capture_current_context           │    │ POST /analyze (LLM 抽 chat)    │
│ capture_screen_without_bubble     │ ─► │ POST /suggest (生成回复)         │ ─► Moonshot
│ read_file_base64                  │    │ POST /tasks/confirm              │     (kimi-k2.6)
│ frontapp (osascript + a11y)       │    │ POST /agent/model/stream (proxy) │     BYOK 时直连
│ + agent 多轮（client 直连 provider）│    │ POST /agent/sessions/...         │
└──────────────────────────────────┘    └─────────────────────────────────┘
         │                                       │                    │
         └───── local SQLite (percent.db) ───────┘                    └── Neon (auth + credits)
```

详细流程见 [`docs/product-flows.md`](docs/product-flows.md)。

数据边界（重要）：

- **本地 SQLite**：`logs` / `people` / `chat_turns` / `chat_messages` / `tasks` / `agent_sessions` / `agent_messages`
- **Neon PostgreSQL**（Prisma + Better Auth）：`User` / `Session` / `Account` / `UserCredit` / `CreditTransaction` — 仅账号 + 积分
- **CMS**（内部运营）：**只读 Neon**，不读本地 SQLite、不看聊天内容

---

## 自己跑起来

> **打包 / Distribution**：预编译 `.dmg` / `.app` 还没出，目前只能从源码跑（待定）。  
> 正式 release 包发布前，请从源码跑：

需要：macOS + Node ≥ 20 + pnpm + Rust（[Tauri 2 前置](https://v2.tauri.app/start/prerequisites/)）。

```bash
pnpm install
pnpm dev
```

`pnpm dev` 会并行启动：
- `percent-server`（Hono，端口默认 3001）
- `percent-tracker`（Tauri dev，会弹一个原生窗口）
- `percent-cms`（Next.js，端口默认 3000）

首次启动会引导你授予 macOS 三类权限：屏幕录制、辅助功能、输入监控。  
授权后重启应用生效。

> **TODO 打包方式**：参见 `apps/client/src-tauri/tauri.conf.json` 的 `bundle` 配置；预编译分发包待定（GitHub Releases / 官网下载）。

---

## 仓库结构

```
percent/
├── apps/
│   ├── client/      # Tauri macOS 客户端 (React + Vite + Tailwind + Rust)
│   ├── server/      # Hono 后端 (Prisma + better-sqlite3 + Better Auth)
│   ├── cms/         # 内部运营 CMS (Next.js) — 只读 Neon
│   └── landing/     # 官网 thepercentai.com (Vite + React)
├── packages/
│   └── runtime/     # 共享 agent core (@percent/runtime)
├── docs/
│   └── product-flows.md   # 三条产品线详细流程（真源）
├── PRIVACY.md
├── TERMS.md
├── LICENSE
└── README.md
```

---

## 开发

```bash
pnpm dev              # 上面 3 个一起起
pnpm client           # 只起 Tauri 客户端
pnpm server           # 只起 Hono server
pnpm cms              # 只起 CMS
```

server 端测试：

```bash
cd apps/server
pnpm test
```

---

## License

[MIT](LICENSE) · [Privacy Policy](PRIVACY.md) · [Terms of Service](TERMS.md)

© 2026 Percent Authors
