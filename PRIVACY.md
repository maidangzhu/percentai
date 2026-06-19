# 隐私政策 / Privacy Policy

最后更新 / Last updated: 2026-06-18

## 概要 / Summary

Percent 是一个本地优先（local-first）的 macOS 工具，默认以 **BYOK（自带 API key）** 模式运行。**你的聊天记录、任务、联系人、截图、API key 全部存在你自己的 Mac 上（`~/.percent-tracker/`），我们看不到也拿不到。** 客户端直连你配置的 LLM provider（OpenAI / Anthropic / Moonshot / 等），完全不经过 Percent 的服务器。

Percent is a local-first macOS tool that runs BYOK (Bring Your Own Key) by default. **Your chats, tasks, contacts, screenshots, and API key live only on your Mac (`~/.percent-tracker/`). We cannot see or access them.** The client talks to your configured LLM provider directly — no Percent server is involved in the data path.

---

## 1. 我们收集什么 / What We Collect

### 1.1 不收集 / Nothing

BYOK 模式下 Percent 不上传任何用户数据：没有账号、没有登录、没有积分、没有 usage 上报。所有 LLM 调用直连 provider。

In BYOK mode Percent uploads nothing: no account, no login, no credits, no usage telemetry. Every LLM call goes directly from your Mac to your provider.

### 1.2 之前留下的（云模式已停用）/ What used to be there (cloud mode retired)

2026-06 之前的版本曾有一个可选的云模式（server 转发 LLM + 积分扣费）。该模式已停用，代码保留但不再 deploy、不再运行。如果你的 Neon 数据库里还残留旧的账号 / 积分数据，发邮件到下方邮箱申请删除。

Earlier versions had an optional cloud mode (server-side LLM proxy + credit deduction). It has been retired: the code is kept in git history but is no longer deployed or run. If your Neon DB still has stale account / credit records, email us to delete them.

---

## 2. 本地数据 / Local Data (Stays on Your Mac)

所有下列数据**只在你本机**：

All the following stays **only on your Mac**:

| 数据 / Data | 位置 / Location | 说明 / Notes |
|------------|----------------|-------------|
| 聊天记录、任务、联系人 / Chats, tasks, contacts | `~/.percent-tracker/percent.db` (SQLite) | Snowflake ID 主键 |
| 截图 / Screenshots | `~/.percent-tracker/screenshots/*.png` | "Clear cache" 一键清空 |
| 客户端日志 / Logs | `~/.percent-tracker/bubble-pipeline.log` | 结构化 JSON，含 `trace_id` |
| BYOK API key | `~/.percent-tracker/byok.key` (Tauri 文件, mode 0600) | 不进 localStorage，不上云 |
| BYOK 非秘密配置 / Non-secret BYOK config | browser localStorage | provider / modelId / modelName / baseUrl |
| 快捷键、设置 / Shortcut, settings | `~/.percent-tracker/settings.json` | |

---

## 3. 第三方数据流 / Third-Party Data Flows

你的数据在以下时刻离开你的 Mac：

Your data leaves your Mac at the following moments:

| 场景 / Scenario | 去向 / Destination | 数据 / What's sent |
|----------------|--------------------|--------------------|
| 按 Enter 留痕 / Draft a reply / Capture task | 你配置的 LLM provider（OpenAI / Anthropic / MiniMax / Moonshot / 等） | 当前截图 + 该联系人历史 chat 上下文（多模态分析） |
| Agent 多轮对话 | 同上 | 你的 prompt + 工具调用结果 |
| 网络请求（基于 tauri-plugin-http） | provider | 不经 Percent server。CORS 由 Rust 侧绕过（只允许白名单内 URL） |

默认 BYOK 模式下，**没有任何数据经过 Percent 控制的服务器**。

In default BYOK mode, **no data passes through any server Percent controls**.

### 3.1 provider 白名单 / Provider allowlist

客户端通过 `tauri-plugin-http` 走 Rust 进程发请求以绕过 WebView CORS。`apps/client/src-tauri/capabilities/default.json` 里维护了一个 URL 白名单——加新 provider 需要同时改 capabilities 和重 build。

The client uses `tauri-plugin-http` to bypass WebView CORS via the Rust process. A URL allowlist in `apps/client/src-tauri/capabilities/default.json` restricts which providers can be reached — adding a new provider requires updating the capabilities and rebuilding.

---

## 4. macOS 权限 / macOS Permissions

Percent 申请三类权限，缺一不可：

Percent requests three macOS permissions, all required:

| 权限 / Permission | 用途 / Why |
|------------------|------------|
| 屏幕录制 / Screen Recording | 截屏（按 Enter 留痕、Draft a reply、Capture task、Agent 问屏幕） |
| 辅助功能 / Accessibility | 识别当前前台 app（微信 / 其他 IM） |
| 输入监控 / Input Monitoring | 监听全局按键（默认 Enter，可在 Settings 改） |

你随时可以在 **系统设置 → 隐私与安全** 中撤销任何权限。

You can revoke any permission anytime via **System Settings → Privacy & Security**.

---

## 5. 你的权利 / Your Rights

- **导出本地数据 / Export**: SQLite 文件 `~/.percent-tracker/percent.db` 是标准格式，可自行复制（暂无 UI 导出）
- **删除本地数据 / Delete local data**: 主窗口 → Settings → "Clear cache" 清截图与 enter-log；DB 可手动 `rm`
- **删除截图 / Delete screenshots**: 同上
- **删除 BYOK key / Delete BYOK key**: 主窗口 → Settings → BYOK section → 清空

---

## 6. 政策变更 / Policy Changes

如有实质性变更，会在下一个版本更新时在应用内提示。

We will notify you in-app for any material change in the next version.

---

## 7. 联系方式 / Contact

- 隐私相关 / Privacy: privacy@thepercentai.com
- 项目主页 / Project home: https://thepercentai.com
- GitHub: https://github.com/maidangzhu/percent
