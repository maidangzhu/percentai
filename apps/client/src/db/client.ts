// Local SQLite accessor — all calls go through Tauri commands backed by
// Diesel in the Rust process. The webview (WKWebView) doesn't import any
// Node-only module; every persistence operation is an `invoke()` round-trip.

import { invoke } from "@tauri-apps/api/core";

// ── row types (mirrors Rust db::commands structs) ────────────────

export interface LogRow {
  id: string;
  occurred_at: string;
  app_name: string;
  app_bundle_id: string;
  is_send: number; // 0/1
  is_wechat: number; // 0/1
  screenshot_path: string | null;
  created_at: string;
}

export interface LogRowWithTurn {
  id: string;
  occurred_at: string;
  app_name: string;
  app_bundle_id: string;
  is_send: number;
  is_wechat: number;
  screenshot_path: string | null;
  created_at: string;
  turn_id: string | null;
  topic: string | null;
  partner_name: string | null;
  person_id: string | null;
}

export interface PersonSummary {
  id: string;
  name: string;
  client_app: string;
  created_at: string;
  updated_at: string;
  turn_count: number;
  last_chat_at: string | null;
}

export interface ChatMessageJson {
  role: string;
  content: string;
  captured_at: string;
  topic: string;
  sender_name: string | null;
}

export interface ChatTurnJson {
  id: string;
  log_id: string;
  topic: string;
  captured_at: string;
  messages: ChatMessageJson[];
}

export interface PersonDetail extends PersonSummary {
  turns: ChatTurnJson[];
  messages: ChatMessageJson[];
}

export interface TaskRow {
  id: string;
  person_id: string | null;
  log_id: string | null;
  source_turn_id: string | null;
  title: string;
  description: string;
  due_at: string | null;
  status: string;
  fingerprint: string;
  evidence: string;
  raw_ai_response: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface AgentSessionSummary {
  id: string;
  title: string;
  message_count: number;
  last_user_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface AgentMessageJson {
  id: string;
  role: string;
  kind: string;
  content: string;
  tool_name: string | null;
  tool_input: unknown;
  tool_result: unknown;
  is_error: number; // 0/1
  seq: number;
  created_at: string;
}

export interface AgentSessionDetail {
  id: string;
  title: string;
  messages: AgentMessageJson[];
}

export interface Stats {
  tasks_total: number;
  tasks_pending: number;
  tasks_completed: number;
  people: number;
  chat_turns: number;
  chat_messages: number;
  logs: number;
  ai_interactions: number;
  ai_reply_suggestions: number;
  ai_task_detections: number;
  ai_agent_messages: number;
}

// ── invoke wrappers ─────────────────────────────────────────────

export const db = {
  // logs
  listLogs: (limit = 100, appName?: string) =>
    invoke<LogRow[]>("db_list_logs", { limit, appName: appName ?? null }),
  listLogsWithLastTurn: (limit = 100) =>
    invoke<LogRowWithTurn[]>("db_list_logs_with_last_turn", { limit }),
  createLog: (input: {
    id: string;
    occurredAt: string;
    appName: string;
    appBundleId?: string;
    isSend?: boolean;
    isWechat?: boolean;
    screenshotPath?: string | null;
  }) =>
    invoke<LogRow>("db_create_log", {
      id: input.id,
      occurredAt: input.occurredAt,
      appName: input.appName,
      appBundleId: input.appBundleId ?? null,
      isSend: input.isSend ?? false,
      isWechat: input.isWechat ?? false,
      screenshotPath: input.screenshotPath ?? null,
    }),

  // people
  listPeople: (query?: string, limit = 50) =>
    invoke<PersonSummary[]>("db_list_people", {
      query: query ?? null,
      limit,
    }),
  getPerson: (id: string) => invoke<PersonDetail | null>("db_get_person", { id }),
  createPerson: (input: { id: string; name: string; clientApp?: string }) =>
    invoke<PersonSummary>("db_create_person", {
      id: input.id,
      name: input.name,
      clientApp: input.clientApp ?? null,
    }),
  deletePerson: (id: string) => invoke<void>("db_delete_person", { id }),

  // tasks
  listTasks: (status?: "pending" | "completed" | "all", limit = 100) =>
    invoke<TaskRow[]>("db_list_tasks", { status: status ?? null, limit }),
  getTask: (id: string) => invoke<TaskRow | null>("db_get_task", { id }),
  getTaskByFingerprint: (fingerprint: string) =>
    invoke<TaskRow | null>("db_get_task_by_fingerprint", { fingerprint }),
  createTask: (input: {
    id: string;
    title: string;
    description?: string;
    dueAt?: string | null;
    personId?: string | null;
    logId?: string | null;
    sourceTurnId?: string | null;
    evidence?: string;
    fingerprint: string;
  }) =>
    invoke<TaskRow>("db_create_task", {
      id: input.id,
      title: input.title,
      description: input.description ?? null,
      dueAt: input.dueAt ?? null,
      personId: input.personId ?? null,
      logId: input.logId ?? null,
      sourceTurnId: input.sourceTurnId ?? null,
      evidence: input.evidence ?? null,
      fingerprint: input.fingerprint,
    }),
  updateTask: (input: {
    id: string;
    title?: string;
    description?: string;
    /** double Option: undefined = don't change, null = clear, string = set */
    dueAt?: string | null;
    status?: "pending" | "completed";
  }) =>
    invoke<TaskRow>("db_update_task", {
      id: input.id,
      title: input.title ?? null,
      description: input.description ?? null,
      dueAt: input.dueAt === undefined ? null : input.dueAt,
      status: input.status ?? null,
    }),
  deleteTask: (id: string) => invoke<void>("db_delete_task", { id }),
  recordAiEvent: (input: {
    id: string;
    eventType: "reply_suggestion" | "task_detection" | "task_created" | "agent_interaction";
    refId?: string | null;
    metadata?: unknown;
  }) =>
    invoke<void>("db_record_ai_event", {
      id: input.id,
      eventType: input.eventType,
      refId: input.refId ?? null,
      metadata: input.metadata ?? null,
    }),

  // stats
  getStats: () => invoke<Stats>("db_get_stats"),

  // agent_sessions
  listAgentSessions: () => invoke<AgentSessionSummary[]>("db_list_agent_sessions"),
  getAgentSession: (id: string) =>
    invoke<AgentSessionDetail | null>("db_get_agent_session", { id }),
  createAgentSession: (input: {
    id: string;
    userId: string;
    title?: string;
    screenContext?: unknown;
  }) =>
    invoke<AgentSessionDetail>("db_create_agent_session", {
      id: input.id,
      userId: input.userId,
      title: input.title ?? null,
      screenContext:
        input.screenContext === undefined
          ? null
          : JSON.stringify(input.screenContext),
    }),
  deleteAgentSession: (id: string) =>
    invoke<void>("db_delete_agent_session", { id }),
  appendAgentMessage: (input: {
    sessionId: string;
    id: string;
    role: string;
    kind?: string;
    content: string;
    toolName?: string;
    toolInput?: unknown;
    toolResult?: unknown;
    isError?: boolean;
  }) =>
    invoke<AgentMessageJson>("db_append_agent_message", {
      sessionId: input.sessionId,
      id: input.id,
      role: input.role,
      kind: input.kind ?? null,
      content: input.content,
      toolName: input.toolName ?? null,
      toolInput: input.toolInput ?? null,
      toolResult: input.toolResult ?? null,
      isError: input.isError ?? null,
    }),
  batchAppendAgentMessages: (
    sessionId: string,
    messages: Array<{
      role: string;
      kind?: string;
      content: string;
      toolName?: string;
      toolInput?: unknown;
      toolResult?: unknown;
      isError?: boolean;
    }>,
  ) =>
    invoke<AgentMessageJson[]>("db_batch_append_agent_messages", {
      sessionId,
      messages: messages.map((m) => ({
        role: m.role,
        kind: m.kind ?? null,
        content: m.content,
        toolName: m.toolName ?? null,
        toolInput: m.toolInput ?? null,
        toolResult: m.toolResult ?? null,
        isError: m.isError ?? null,
      })),
    }),

  // chat_turns
  createChatTurn: (input: {
    id: string;
    logId: string;
    personId: string;
    topic?: string;
    capturedAt: string;
  }) =>
    invoke<void>("db_create_chat_turn", {
      id: input.id,
      logId: input.logId,
      personId: input.personId,
      topic: input.topic ?? null,
      capturedAt: input.capturedAt,
    }),

  /**
   * Persist the messages returned by the analyze LLM call so the
   * contact-detail view (People → click a name → see chat history)
   * can load them on next open. Without this, the contact's
   * `messages` field is always empty.
   */
  batchInsertChatMessages: (
    messages: Array<{
      id: string;
      turnId: string;
      role: string;
      content: string;
      senderName?: string | null;
      seq: number;
    }>,
  ) =>
    invoke<void>("db_batch_insert_chat_messages", {
      messages: messages.map((m) => ({
        id: m.id,
        turn_id: m.turnId,
        role: m.role,
        content: m.content,
        sender_name: m.senderName ?? null,
        seq: m.seq,
      })),
    }),

  // meta
  getDbPath: () => invoke<string>("db_get_db_path"),

  // cache-clearing operations for the Settings page. Server-side
  // routes were deleted; all wipe operations now go straight to
  // SQLite through dedicated Tauri commands so they run as one
  // atomic transaction on the same connection.
  purgeAllLogs: () => invoke<number>("db_purge_all_logs"),
  purgeAllPeople: () => invoke<number>("db_purge_all_people"),
  purgeAllTasks: () => invoke<number>("db_purge_all_tasks"),
};
