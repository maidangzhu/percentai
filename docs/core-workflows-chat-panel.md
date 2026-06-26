# Percent v2 Core Workflow: Chat Panel

最后更新：2026-06-26  
状态：Draft v0.2  
关联文档：

- `docs/prd-local-first-rebuild.md`
- `docs/technical-architecture-local-first-rebuild.md`
- `v2/openspec/specs/chat-panel/`
- `v2/openspec/specs/bubble-mac/`
- `v2/openspec/specs/calendar/`
- `v2/openspec/specs/intelligence-byok/`
- `v2/openspec/specs/stt-byok/`

---

## 1. 目标

v2 只有一个主交互：用户在一个永远可唤起的气泡里跟本地 Agent 对话。所有"问屏幕 / 找上下文 / 安排 Calendar"都通过这一个 chat panel 走。

本文只定义 chat panel 的技术方案，含三部分：

1. session-start 整屏截图（替代 v1 的"问屏幕"和 Enter Capture 的截图）。
2. chat turn 调用 LLM（替代 v1 的"帮我回"和 Enter Capture 的结构化提取）。
3. Calendar candidate 在 chat 流中识别与确认（替代 v1 的"Enter Capture → Calendar 候选"）。

核心原则（与 v1 一致并加严）：

- UI 只负责触发和展示状态。
- 系统能力由 Tauri plugin / Swift bubble 提供。
- 业务 workflow 负责编排、审计、降级。
- 本地 SQLite 是业务真源。
- Zustand 只管理临时 UI / runtime state。
- AI provider 差异只存在于 `services/intelligence` 和 `services/stt`，不进入 workflow。

---

## 2. 不需要 LangGraph

P0 不需要 LangGraph。Chat panel 是一个明确的、会话内的循环：用户输入 → 调 LLM → 流式回包 → 落库。每个 chat turn 是一次 `chatPanelWorkflow.ask()`，不是 multi-agent orchestration。

---

## 3. 共享架构

```text
Bubble (Swift)
  -> composer submitted
  -> apps/client / services/chatPanel / chatPanelService
  -> chatPanelWorkflow
  -> repositories
  -> SQLite

chatPanelWorkflow
  -> services/screen (session-start capture)
  -> services/bubble (hide-during-capture)
  -> services/intelligence (generateText / streamText)
  -> services/calendar (suggest / confirm)
  -> services/aiEvents (audit)
```

### 3.1 目录建议

```text
apps/client/src/
  services/
    chat-panel/
      chatPanelService.ts
      chatPanelWorkflow.ts
      chatPanelTypes.ts
      chatPanelErrors.ts
      chatPanelComposers.ts   (message / tool-call / calendar-card composers)
    intelligence/
      intelligenceService.ts
      adapters/*
    stt/
      sttService.ts
    audio/
      recorder.ts
    screen/
      capture.ts
    calendar/
      appleCalendar.ts
    bubble/
      bubbleClient.ts
    updater/
      updaterService.ts

  db/repositories/
    chatSessionsRepo.ts
    chatMessagesRepo.ts
    calendarCandidatesRepo.ts
    workflowRunsRepo.ts
    aiEventsRepo.ts
    aiProviderConfigsRepo.ts
    sttProviderConfigsRepo.ts
    appSettingsRepo.ts

  stores/
    chatPanelStore.ts          (Zustand, UI state only)
    bubbleStore.ts             (Zustand, UI state only)
    composerStore.ts           (Zustand, draft only)
```

### 3.2 不能放在 workflow 里的东西

- Provider-specific request format
- API key 解析
- UI toast / modal 操作
- React state mutation
- 直接 SQL
- 自动发送 IM 消息
- 用户画框 / 区域选择

### 3.3 必须由 workflow 负责的东西

- trace id
- workflow run 创建和状态更新
- 依赖权限检查
- 失败降级
- 幂等和防重
- repository 事务边界
- 输出 contract
- ai_events 写入

---

## 4. Chat session 生命周期

```text
bubble.show(bar)
  -> user types
  -> user submits
       - Enter  -> chatPanelWorkflow.startSession + ask (text only)
       - Cmd+Enter -> chatPanelWorkflow.startSession + ask (text + screen)
  -> bubble.setState(panel)
       - panel shows streaming response
  -> user closes panel
       - bubble.setState(dot)
       - session persists in chat_sessions
```

### 4.1 session-start 截图

```ts
async function startSession(input: { draft: string; withScreen: boolean }) {
  const run = await workflowRuns.create({ type: "chat_panel", traceId });

  let screenshotRef: string | null = null;
  if (input.withScreen) {
    const result = await services.screen.captureCurrentScreen({
      hideBubble: true,
      source: "chat_panel_session_start",
    });
    if (result.ok) {
      screenshotRef = result.capture.path;
    } else {
      // text-only fallback; workflow run is still created
    }
  }

  const session = await chatSessions.create({
    id: newId(),
    startScreenshotPath: screenshotRef,
    draft: input.draft,
  });
  return { runId: run.id, sessionId: session.id };
}
```

整张截图只附在 session 的第一条消息；后续消息不附图。

### 4.2 ask turn

```ts
async function ask(input: { sessionId, text, withScreen }) {
  const session = await chatSessions.get(input.sessionId);
  const conn = await intelligenceService.resolveConnection();
  if (conn.status !== "success") {
    return { error: conn };
  }

  const messages = await buildMessages({
    session,
    text: input.text,
    withScreen: input.withScreen,
  });

  return intelligenceService.streamText({
    conn,
    messages,
    onEvent: (event) => writeAiEvent({ runId, event }),
  });
}
```

`buildMessages` 的规则：

- 第一条消息 + withScreen 且 `provider_image` ready：附 session-start screenshot。
- 第一条消息 + withScreen 但 `provider_image` not ready：降级为 text-only，UI 提示。
- 第一条消息 + 文本 / 第二条及以后：不附图。
- 拼装 prompt 时只带必要 context，不带全 chat history。

---

## 5. Calendar candidate flow

```ts
// 在 streamText 的 tool call 里
type CalendarCandidate = {
  title: string;
  description?: string;
  startAt: string;
  endAt: string;
  allDay: boolean;
  personHint?: string;
  confidence: number;
};

// chatPanelWorkflow 收到 tool call
async function onCalendarCandidate(candidate: CalendarCandidate, ctx) {
  const local = await calendarCandidates.create({
    chatSessionId: ctx.sessionId,
    chatMessageId: ctx.messageId,
    status: "suggested",
    ...candidate,
  });
  return { kind: "calendar_card", id: local.id };
}
```

Calendar card 是 chat panel 消息流里的一个特殊节点，不是独立的 popover / toast。点 Confirm / Dismiss 由用户驱动。

Confirm：

```ts
async function confirmCalendarCandidate(id: string) {
  const cand = await calendarCandidates.get(id);
  await calendarCandidates.update(id, { status: "confirmed" });
  if (permission.calendar) {
    const result = await appleCalendar.createEvent(cand);
    if (result.ok) {
      await calendarCandidates.update(id, {
        appleCalendarEventId: result.eventId,
        syncStatus: "synced",
      });
    } else {
      await calendarCandidates.update(id, { syncStatus: "failed" });
    }
  }
}
```

失败不删本地 row。

---

## 6. STT / 录音 flow

```text
user taps mic in bar
  -> services/audio.startMicRecording
  -> recorder handles Microphone permission
  -> bubble.setState(bar + recording)
  -> user stops
  -> services/stt.transcribe(audioBuffer, sttConnection)
  -> text appears in composer
  -> user edits
  -> user submits
```

STT 永远不直接进 chat session，永远先落到 composer 由用户编辑。`stt_transcribe` 调用也要写 `ai_events`。

---

## 7. 共享表

```text
chat_sessions
chat_messages
calendar_candidates
workflow_runs
ai_events
app_settings
ai_provider_configs
stt_provider_configs
provider_capability_results
```

### 7.1 chat_sessions

```text
id
created_at
updated_at
start_screenshot_path         -- session-start capture, nullable
start_screenshot_taken_at
start_screenshot_display_id
draft                         -- 第一条 user 消息的草稿
title                         -- 可选
status                        -- "open" | "closed"
```

### 7.2 chat_messages

```text
id
chat_session_id
role                          -- "user" | "assistant" | "tool"
kind                          -- "text" | "calendar_card" | "tool_call" | "tool_result"
content_json
attachment                    -- { kind: "screen", sessionStartScreenshot: true } | null
tool_call_id
parent_message_id
created_at
```

### 7.3 calendar_candidates

```text
id
chat_session_id
chat_message_id
title
description
start_at
end_at
all_day
person_id
status                        -- "suggested" | "confirmed" | "dismissed" | "done" | "sync_failed"
confidence
apple_calendar_event_id
sync_status
created_at
updated_at
```

### 7.4 workflow_runs

```text
id
type                          -- "chat_panel" | "calendar_suggest" | "calendar_confirm" | ...
trace_id
status                        -- "running" | "succeeded" | "failed" | "partial"
started_at
completed_at
error_code
error_message
related_session_id
related_message_id
metadata_json
```

### 7.5 ai_events

```text
id
workflow_run_id
trace_id
provider_profile_id           -- "llm:<id>" | "stt:<id>"
provider_type
model
request_kind                  -- "chat_panel" | "ask_screen_legacy" | "calendar_extraction" | "provider_text_test" | "provider_image_test" | "stt_transcribe" | ...
image_attached
status                        -- "succeeded" | "failed"
error_code
latency_ms
redacted_request_preview
redacted_response_preview
created_at
```

注意：v2 P0 没有 `request_kind = "reply_suggestion"` 也没有 `"enter_capture"`。`ask_screen_legacy` 只用来兼容旧 ai_events 解析，不在 v2 写入。

---

## 8. 错误 / 降级

| 失败 | 降级 |
|---|---|
| 没有任何 provider | chat panel input disabled，UI 提示配置 intelligence |
| provider text 未测试 | chat panel input disabled，UI 提示运行 Text Test |
| provider image 未就绪 | bar 中 `⌘+Enter` 降级为文本发送，UI 提示该消息没有附图 |
| Screen Recording 未授权 | `⌘+Enter` 降级为文本发送，UI 提示授权 |
| session-start 截图失败 | session 仍创建，提示截图失败，文本 turn 继续 |
| STT provider 未配置 | mic 按钮 disabled，UI 提示配置 STT |
| STT 调用失败 | 录音保留 buffer，UI 提示重试，composer 不变 |
| Microphone 未授权 | mic 按钮 disabled，UI 提示授权 |
| Apple Calendar 写入失败 | 本地 row 标 `sync_failed`，UI 提示重试 |
| Apple Calendar 未授权 | Confirm 仍可走本地，UI 提示授权 |

任何降级都必须：

- 给出下一步（Open System Settings / Run Test / Configure）。
- 写 `workflow_runs.status = "partial"` 或 `"failed"`。
- 不弹模态打断。

---

## 9. 验收

- chat session 在 session-start 截图时气泡被隐藏并恢复。
- 第一条消息在权限齐备时附 session-start 截图。
- 后续消息不附图。
- mic → STT → 文本 → 用户编辑 → 提交链路可走通。
- Calendar 卡 confirm 后 Apple Calendar 写入成功，本地 row 标 `confirmed`。
- Calendar 卡 confirm 在 Apple Calendar 写入失败时本地 row 仍保留，标 `sync_failed`。
- chat session 关闭后历史可在 dashboard 看到。
- 任何 workflow capture 都不包含气泡。
- 屏幕共享中气泡不可见。
- 一次下载后，第二次版本更新走应用内更新。
