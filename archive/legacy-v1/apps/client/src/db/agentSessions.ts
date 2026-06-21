// Local CRUD for the "ask the screen" agent sessions and messages.
// Replaces the old server routes /agent/sessions/* — those don't exist on
// the cloud anymore (server is now LLM-proxy only). The agent runs in
// the client's webview; its conversation state lives in local SQLite.

import { db, type AgentMessageJson, type AgentSessionDetail } from "./client";
import { newSnowflakeId } from "@/lib/snowflake";

export interface AgentSessionSummary {
  id: string;
  title: string;
  messageCount: number;
  lastUserMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AgentMessage {
  id: string;
  role: "user" | "assistant";
  kind: "message" | "reasoning" | "tool_call" | "tool_result" | "error";
  content: string;
  toolName?: string | null;
  toolInput?: unknown;
  toolResult?: unknown;
  isError?: boolean;
  seq: number;
  createdAt: string;
}

function fromRow(m: AgentMessageJson): AgentMessage {
  return {
    id: m.id,
    role: m.role as AgentMessage["role"],
    kind: m.kind as AgentMessage["kind"],
    content: m.content,
    toolName: m.tool_name,
    toolInput: m.tool_input ?? undefined,
    toolResult: m.tool_result ?? undefined,
    isError: m.is_error === 1,
    seq: m.seq,
    createdAt: m.created_at,
  };
}

function toSummary(s: {
  id: string;
  title: string;
  message_count: number;
  last_user_message: string | null;
  created_at: string;
  updated_at: string;
}): AgentSessionSummary {
  return {
    id: s.id,
    title: s.title,
    messageCount: s.message_count,
    lastUserMessage: s.last_user_message,
    createdAt: s.created_at,
    updatedAt: s.updated_at,
  };
}

function toDetail(s: AgentSessionDetail): {
  id: string;
  title: string;
  messages: AgentMessage[];
} {
  return {
    id: s.id,
    title: s.title,
    messages: s.messages.map(fromRow),
  };
}

export async function listAgentSessions(): Promise<AgentSessionSummary[]> {
  const rows = await db.listAgentSessions();
  return rows.map(toSummary);
}

export async function getAgentSession(
  id: string,
): Promise<{ id: string; title: string; messages: AgentMessage[] } | null> {
  const detail = await db.getAgentSession(id);
  return detail ? toDetail(detail) : null;
}

export async function createAgentSession(opts: {
  userId: string;
  title?: string;
  screenContext?: unknown;
}): Promise<{ id: string; title: string; messages: AgentMessage[] }> {
  const detail = await db.createAgentSession({
    id: newSnowflakeId(),
    userId: opts.userId,
    title: opts.title,
    screenContext: opts.screenContext,
  });
  return toDetail(detail);
}

export async function deleteAgentSession(id: string): Promise<void> {
  await db.deleteAgentSession(id);
}

export async function appendAgentMessage(opts: {
  sessionId: string;
  role: "user" | "assistant";
  kind?: AgentMessage["kind"];
  content: string;
  toolName?: string;
  toolInput?: unknown;
  toolResult?: unknown;
  isError?: boolean;
}): Promise<AgentMessage> {
  const row = await db.appendAgentMessage({
    sessionId: opts.sessionId,
    id: newSnowflakeId(),
    role: opts.role,
    kind: opts.kind,
    content: opts.content,
    toolName: opts.toolName,
    toolInput: opts.toolInput,
    toolResult: opts.toolResult,
    isError: opts.isError,
  });
  return fromRow(row);
}

export async function batchAppendAgentMessages(
  sessionId: string,
  messages: Array<{
    role: "user" | "assistant";
    kind?: AgentMessage["kind"];
    content: string;
    toolName?: string;
    toolInput?: unknown;
    toolResult?: unknown;
    isError?: boolean;
  }>,
): Promise<AgentMessage[]> {
  const rows = await db.batchAppendAgentMessages(sessionId, messages);
  return rows.map(fromRow);
}
