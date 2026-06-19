# Percent

> macOS 上的本地 AI 伙伴，数据永不上云。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Platform: macOS](https://img.shields.io/badge/Platform-macOS-blue.svg)](#)
[![Stack: Tauri 2](https://img.shields.io/badge/Stack-Tauri%202-orange.svg)](#)

[官网](https://thepercentai.com) · [Privacy Policy](PRIVACY.md) · [Terms of Service](TERMS.md)

---

微信里按 Enter，这条对话自动存下来 — 不切窗口、不截图、不点按钮。
截个屏，它读上下文、生成得体的回复，⌘V 直接发（永远不替你发）。
淹没在对话里的"明天下午你过来看看"自动捞出来，弹给你确认再写库。
"上次答应过这个客户什么事" — 截个屏一句话问它，它翻你本地记录再答你。

---

## 核心功能

- **按 Enter 自动留痕** — 微信里按回车，这条对话自动存下来。想翻"上周和谁聊过什么"不用滚聊天记录。
- **帮我回** — 截个屏，它读上下文，生成得体的回复，⌘V 直接发。**永远不自动发送**，粘贴前你能看见、能改。
- **记任务** — "明天下午你过来看看"、"回头把资料发我" — 这种隐性 todo 自动捞出来，弹确认后再写库；可选同步到 macOS Calendar。
- **问屏幕** — "这个人是谁"、"上次答应过这个客户什么事" — 截个屏一句话问它，它用工具（找人、查聊天、记任务、起草回复）持续多轮回答。

---

## 自己跑起来

需要：macOS + Node ≥ 20 + pnpm + Rust（[Tauri 2 前置](https://v2.tauri.app/start/prerequisites/)）。

```bash
pnpm install
pnpm dev
```

`pnpm dev` 启动：
- `percent`（Tauri dev，会弹一个原生窗口）
- `percent-cms`（Next.js，端口默认 3000，运营用）
- `percent-landing`（Vite，端口默认 5180）

> **BYOK 是默认模式**：LLM 调用完全直连你配置的 provider（OpenAI / Anthropic / Moonshot / MiniMax 等），不经任何 Percent 服务器。CORS 由 Tauri 的 Rust 侧绕过（`tauri-plugin-http`），provider URL 在 `apps/client/src-tauri/capabilities/default.json` 里白名单。
>
> 首次启动 → 主窗口 → Settings → BYOK section → 填 provider + 模型 + API key → 保存。配置完成后所有 AI 功能（按 Enter 留痕 / 帮我回 / 记任务 / 问屏幕）才能工作。

首次启动会引导你授予 macOS 三类权限：屏幕录制、辅助功能、输入监控。  
授权后重启应用生效。

> 预编译 `.dmg` 可以在 [Releases](https://github.com/maidangzhu/percentai/releases) 下载。

---

## 仓库结构

```
percent/
├── apps/
│   ├── client/      # Tauri macOS 客户端 (React + Vite + Tailwind + Rust)
│   ├── server/      # Hono 后端 (历史 cloud 模式代码，保留但不 deploy)
│   ├── cms/         # 内部运营 CMS (Next.js)
│   └── landing/     # 官网 thepercentai.com (Vite + React)
├── packages/
│   └── runtime/     # 共享 agent core (@percent/runtime, pi-ai + pi-agent-core)
├── docs/
│   ├── current-state.md   # 架构 + 决策记录
│   └── onboarding.md      # 首次启动流程 + 配置入口的产品 spec
├── PRIVACY.md
├── TERMS.md
├── LICENSE
└── README.md
```

> `apps/server` 目录保留了之前的 Hono 代码（之前曾是 Cloud 模式：server 转发 LLM + 积分扣费），但 dev / deploy 都已经切走——`pnpm dev` 不再启动它。如需恢复旧 cloud 模式可用 `pnpm dev:server` 显式启动。

---

## Contributing

详情见 [CONTRIBUTING.md](CONTRIBUTING.md)。  
Issue / Discussion 也欢迎 — bug、想法、吐槽都可以。

---

## License

[MIT](LICENSE) · [Privacy Policy](PRIVACY.md) · [Terms of Service](TERMS.md)

© 2026 Percent Authors
