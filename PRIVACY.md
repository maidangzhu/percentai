# 隐私政策 / Privacy Policy

最后更新 / Last updated: 2026-06-09

## 概要 / Summary

Percent 是一个本地优先（local-first）的 macOS 工具。**你的聊天记录、任务、联系人、截图全部存在你自己的 Mac 上（`~/.percent-tracker/`），我们看不到也拿不到。** 唯一上传到云端的是你的账号信息（邮箱 + 密码哈希）和积分余额。

Percent is a local-first macOS tool. **Your chats, tasks, contacts, and screenshots live only on your Mac (`~/.percent-tracker/`). We cannot see or access them.** The only data we upload to the cloud is your account (email + password hash) and credit balance.

---

## 1. 我们收集什么 / What We Collect

### 1.1 账号数据 / Account data

存于 Neon PostgreSQL（经 Better Auth）：

- 邮箱、密码哈希、登录 session
- 积分余额、积分流水

Stored in Neon PostgreSQL (via Better Auth):

- Email, password hash, login sessions
- Credit balance and transaction history

### 1.2 使用事件 / Usage events

- 跨设备登录记录（你哪天在哪个设备上登录了 Percent）
- BYOK 路径下的 provider / model / token 计数（**不存 key，不存内容**）

### 1.3 我们不收集 / What we do NOT collect

- 聊天内容（始终本地；分析时临时送 Moonshot，见 §3）
- 截图
- 任务、联系人、agent 对话
- BYOK API key（始终在 Tauri 文件 `~/.percent-tracker/byok.key`，mode 0600）

---

## 2. 本地数据 / Local Data (Stays on Your Mac)

所有下列数据**只在你本机**：

All the following stays **only on your Mac**:

| 数据 / Data | 位置 / Location | 说明 / Notes |
|------------|----------------|-------------|
| 聊天记录、任务、联系人 / Chats, tasks, contacts | `~/.percent-tracker/percent.db` (SQLite) | Snowflake ID 主键 |
| 截图 / Screenshots | `~/.percent-tracker/screenshots/*.png` | "Clear cache" 一键清空 |
| 客户端 / 服务端日志 / Logs | `~/.percent-tracker/{bubble,server}-pipeline.log` | 结构化 JSON，含 `trace_id` |
| BYOK API key | `~/.percent-tracker/byok.key` (Tauri 文件, mode 0600) | 不进 localStorage，不上云 |
| BYOK 非秘密配置 / Non-secret BYOK config | browser localStorage | provider / modelId / modelName / baseUrl |
| 快捷键、设置 / Shortcut, settings | `~/.percent-tracker/settings.json` | |

---

## 3. 第三方数据流 / Third-Party Data Flows

你的数据在以下时刻离开你的 Mac：

Your data leaves your Mac at the following moments:

| 场景 / Scenario | 去向 / Destination | 数据 / What's sent |
|----------------|--------------------|--------------------|
| 按 Enter 留痕 / Draft a reply / Capture task | Moonshot AI（kimi-k2.6） | 当前截图 + 该联系人历史 chat 上下文（多模态分析） |
| 默认路径下的 Agent 多轮对话 | Moonshot AI（kimi-k2.6）经 Percent server 代理 | 你的 prompt + 工具调用结果 |
| BYOK 路径下的 Agent 多轮对话 | 你配置的 provider（OpenAI / Anthropic / 等） | 你的 prompt + 工具调用结果（**完全不经 Percent server**） |
| 账号登录、积分扣减 | Neon PostgreSQL | 邮箱 / 密码哈希 / 积分流水 |

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
- **注销账号 / Delete account**: 发邮件到下方邮箱，7 天内删除 Neon 上的账号和积分记录

---

## 6. 政策变更 / Policy Changes

如有实质性变更，会在下一个版本更新时在应用内提示。

We will notify you in-app for any material change in the next version.

---

## 7. 联系方式 / Contact

- 隐私相关 / Privacy: privacy@thepercentai.com
- 项目主页 / Project home: https://thepercentai.com
- GitHub: https://github.com/maidangzhu/percent
