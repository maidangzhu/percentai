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

`pnpm dev` 会并行启动：
- `percent-server`（Hono，端口默认 3001）
- `percent`（Tauri dev，会弹一个原生窗口）
- `percent-cms`（Next.js，端口默认 3000）

首次启动会引导你授予 macOS 三类权限：屏幕录制、辅助功能、输入监控。  
授权后重启应用生效。

> 预编译 `.dmg` 可以在 [Releases](https://github.com/maidangzhu/percentai/releases) 下载。

---

## 仓库结构

```
percent/
├── apps/
│   ├── client/      # Tauri macOS 客户端 (React + Vite + Tailwind + Rust)
│   ├── server/      # Hono 后端 (Prisma + better-sqlite3 + Better Auth)
│   ├── cms/         # 内部运营 CMS (Next.js)
│   └── landing/     # 官网 thepercentai.com (Vite + React)
├── packages/
│   └── runtime/     # 共享 agent core (@percent/runtime)
├── docs/
│   └── product-flows.md   # 三条产品线详细流程
├── PRIVACY.md
├── TERMS.md
├── LICENSE
└── README.md
```

---

## Contributing

详情见 [CONTRIBUTING.md](CONTRIBUTING.md)。  
Issue / Discussion 也欢迎 — bug、想法、吐槽都可以。

---

## License

[MIT](LICENSE) · [Privacy Policy](PRIVACY.md) · [Terms of Service](TERMS.md)

© 2026 Percent Authors
