# Percent

> macOS 上的本地 AI 伙伴，数据永不上云。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Platform: macOS](https://img.shields.io/badge/Platform-macOS-blue.svg)](#)
[![Stack: Tauri 2](https://img.shields.io/badge/Stack-Tauri%202-orange.svg)](#)

[官网](https://thepercentai.com) · [Privacy Policy](PRIVACY.md) · [Terms of Service](TERMS.md)

---

微信里按 Enter，这条对话自动存下来 — 不切窗口、不截图、不点按钮。
截个屏，它读上下文、生成得体的回复，⌘V 直接发（永远不替你发）。
"上次和这个客户聊到哪" — 截个屏一句话问它，它翻你本地记录再答你。
所有 LLM 请求都走 BYOK，直连你配置的 provider，不经过 Percent 云端。

---

## 核心功能

- **按 Enter 自动留痕** — 微信里按回车，这条对话自动存下来。想翻"上周和谁聊过什么"不用滚聊天记录。
- **帮我回** — 截个屏，它读上下文，生成得体的回复，⌘V 直接发。**永远不自动发送**，粘贴前你能看见、能改。
- **本地记忆** — 聊天上下文、联系人、Agent 对话和截图缓存都在本机 SQLite / 本地文件里。
- **问屏幕** — "这个人是谁"、"上次和这个客户聊到哪" — 截个屏一句话问它，它用本地记录持续多轮回答。

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

> **BYOK 是默认模式**：LLM 调用完全直连你配置的 provider（OpenAI / MiniMax），不经任何 Percent 服务器。CORS 由 Tauri 的 Rust 侧绕过（`tauri-plugin-http`），provider URL 在 `apps/client/src-tauri/capabilities/default.json` 里白名单。
>
> 首次启动 → 主窗口 → Settings → BYOK section → 选择 provider + 模型 + API key → 保存。配置完成后所有 AI 功能（按 Enter 留痕 / 帮我回 / 问屏幕）才能工作。目前保留 OpenAI `gpt-5.5` 和 MiniMax `MiniMax-M3`。

首次启动会引导你授予 macOS 三类权限：屏幕录制、辅助功能、输入监控。  
授权后重启应用生效。

> 预编译 `.dmg` 可以在 [Releases](https://github.com/maidangzhu/percentai/releases) 下载。

---

## 仓库结构

```
percent/
├── apps/
│   ├── client/      # Tauri macOS 客户端 (React + Vite + Tailwind + Rust)
│   ├── server/      # Hono 后端 (历史代码，当前客户端不依赖)
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

> 当前客户端是 local-first + BYOK 直连架构，不依赖 `apps/server` 转发 LLM，也没有云端内容库。

---

## Contributing

详情见 [CONTRIBUTING.md](CONTRIBUTING.md)。  
Issue / Discussion 也欢迎 — bug、想法、吐槽都可以。

---

## License

[MIT](LICENSE) · [Privacy Policy](PRIVACY.md) · [Terms of Service](TERMS.md)

© 2026 Percent Authors
