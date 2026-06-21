# Percent

> macOS local-first AI companion for chat context, reply suggestions, screen Q&A, contacts, and Calendar.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Platform: macOS](https://img.shields.io/badge/Platform-macOS-blue.svg)](#)
[![Stack: Tauri 2](https://img.shields.io/badge/Stack-Tauri%202-orange.svg)](#)

[官网](https://thepercentai.com) · [Privacy Policy](PRIVACY.md) · [Terms of Service](TERMS.md)

---

Percent 的核心不是日志页、任务列表或 provider 适配器。核心是：在本地理解用户的聊天上下文，并在回复、回忆、安排日程时提供及时帮助。

当前项目正在按 v2 方向重构：

- Local-first：聊天、截图、联系人、Calendar items、Agent 会话、操作日志默认保存在本机。
- BYOK-first：用户配置自己的 provider、model、base URL 和 API key。
- Suggestion only：永不自动发送消息，所有回复建议必须先让用户看见、可编辑、可复制。
- Calendar-driven：原“任务”方向收敛为 Calendar，默认集成 Apple Calendar。
- Account optional：账号用于会员、授权、更新渠道等，不是本地使用的前置条件。

---

## 核心功能

- **按 Enter 自动留痕** — 用户在 WeChat 等 IM 中发送消息后，Percent 后台记录当前聊天上下文。
- **帮我回** — 基于当前截图和本地上下文生成 3 条可复制回复建议，永不自动发送。
- **问屏幕** — 对当前屏幕发问，首轮带截图，后续默认不重复带图，必要时查询本地联系人、聊天和 Calendar。
- **Contacts** — 本地关系索引，沉淀客户/联系人、聊天摘要和相关 Calendar items。
- **Calendar** — 从聊天承诺中生成 suggested items，用户确认后写入 Apple Calendar。
- **Settings / Intelligence** — 正式产品化 BYOK provider profile、能力测试、权限和本地数据管理。

---

## 项目规范

重要：这个仓库后续按 spec-driven development 工作。不要直接在组件里堆状态和业务逻辑；任何大改动必须先落到规格和 change 中。

### Source of Truth

当前 v2 规格入口：

- [PRD](docs/prd-local-first-rebuild.md) — 产品定位、范围、页面和核心功能。
- [Technical Architecture](docs/technical-architecture-local-first-rebuild.md) — local-first 架构、数据层、Tauri plugin、BYOK、Agent、Calendar、权限、更新。
- [Core Workflows](docs/core-workflows-reply-enter-capture.md) — “帮我回”和“按 Enter 留痕”的 workflow 技术方案。
- [Interaction Guidelines](docs/product-interaction-design-guidelines.md) — 端到端交互、readiness、空/错/加载状态、accessibility、页面规范。

`docs/onboarding.md` 是旧版口径，包含 Logs、Tasks、Cloud sync 等已不符合 v2 方向的内容；v2 不再以它为准。

### OpenSpec Method

大变更使用 OpenSpec 风格：

```text
propose -> specify -> design -> task -> apply -> verify -> archive
```

建议目录：

```text
v2/openspec/
  specs/
    app-readiness-onboarding/
    intelligence-byok/
    reply-suggestion/
    enter-capture/
    ask-screen/
    contacts/
    calendar/
    privacy-data-policy/
  changes/
    <change-id>/
      proposal.md
      design.md
      tasks.md
      specs/<capability>/spec.md
```

每个 change 至少写清：

- 为什么做、范围、非目标。
- requirement 和 scenario。
- UI 状态：empty / loading / error / success / disabled reason。
- 数据表和 migration 影响。
- workflow 状态机和失败降级。
- 测试和验收标准。

### Engineering Boundaries

- SQLite 是本地业务数据真源。
- Zustand 只管理 UI/runtime state，不保存 contacts、messages、calendar items、provider profiles、logs。
- UI component 不直接写 SQL，不直接拼 provider request，不承载长 workflow。
- 核心业务通过 workflow service：`replyWorkflow`、`enterCaptureWorkflow`、`askScreenWorkflow`。
- Provider 差异只存在于 `services/intelligence` 的 profile/adapter 层，业务 workflow 不允许 switch `providerType`。
- 所有系统能力通过 typed Tauri APIs/plugins 暴露：screen、keyboard、permissions、calendar、windows、updater、auth。
- 每个核心 workflow 写 `workflow_runs`；每次 LLM 调用写 `ai_events`。
- API key 优先存 OS keychain；SQLite 只存 `apiKeyRef`。

### Product & UX Rules

- Local-first 必须在首次体验中可见。
- 核心动作不能因为未配置而消失，只能 disabled 并解释原因。
- “帮我回”必须用户可见、可编辑/复制，永不自动发送。
- “问屏幕”session start 截图一次；第一条 query 带图；后续默认不带图；用户刷新屏幕后下一条再带图。
- Enter 留痕是低打扰后台能力，不做每次 toast。
- Calendar candidate 默认是 suggested，用户确认后才写 Apple Calendar。
- 权限缺失不阻止进入应用，只降级受影响能力。
- 错误文案必须包含下一步修复动作。
- Icon-only button 必须有 `aria-label`；表单字段必须有 label；focus-visible 必须可见。

---

## 自己跑起来

需要：macOS + Node ≥ 20 + pnpm + Rust（[Tauri 2 前置](https://v2.tauri.app/start/prerequisites/)）。

当前分支是 v2 重构分支，旧实现已归档到 `archive/legacy-v1/`。如果需要运行旧客户端：

```bash
cd archive/legacy-v1
pnpm install
pnpm dev
```

`pnpm dev` 启动：
- `percent`（Tauri dev，会弹一个原生窗口）
- `percent-cms`（Next.js，端口默认 3000，运营用）
- `percent-landing`（Vite，端口默认 5180）

> legacy v1 的 BYOK 调用直连用户配置的 provider，不经 Percent 服务器。CORS 由 Tauri 的 Rust 侧绕过（`tauri-plugin-http`），provider URL 在 `archive/legacy-v1/apps/client/src-tauri/capabilities/default.json` 里白名单。
>
> v2 目标是 Settings -> Intelligence 中配置 provider profile，并提供 Text / Image / Streaming tests。配置完成后 AI 功能（按 Enter 留痕 / 帮我回 / 问屏幕）才能完整工作。

> 预编译 `.dmg` 可以在 [Releases](https://github.com/maidangzhu/percentai/releases) 下载。

---

## 仓库结构

```
percent/
├── v2/              # clean rebuild workspace
│   ├── apps/
│   ├── packages/
│   └── openspec/
├── archive/
│   └── legacy-v1/   # archived old implementation
│       ├── apps/
│       ├── packages/
│       ├── package.json
│       └── pnpm-workspace.yaml
├── docs/
│   ├── current-state.md
│   ├── prd-local-first-rebuild.md
│   ├── technical-architecture-local-first-rebuild.md
│   ├── core-workflows-reply-enter-capture.md
│   └── product-interaction-design-guidelines.md
├── PRIVACY.md
├── TERMS.md
├── LICENSE
└── README.md
```

> v2 目标架构是 local-first + BYOK。legacy `apps/server` 已归档，P0 客户端不依赖它转发 LLM，也不依赖云端内容库。

---

## Contributing

详情见 [CONTRIBUTING.md](CONTRIBUTING.md)。  
Issue / Discussion 也欢迎 — bug、想法、吐槽都可以。

---

## License

[MIT](LICENSE) · [Privacy Policy](PRIVACY.md) · [Terms of Service](TERMS.md)

© 2026 Percent Authors
