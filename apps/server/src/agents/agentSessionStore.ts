import { prisma } from "../db/client.js";
import { newSnowflakeId } from "../lib/snowflake.js";

// 「问屏幕」session 的业务封装。路由层只做 HTTP 翻译，不直接碰 prisma。

export type AgentMessageKind =
  | "message"
  | "reasoning"
  | "tool_call"
  | "tool_result"
  | "error";

export interface AgentScreenContext {
  app_name: string;
  app_bundle_id?: string;
  occurred_at: string;
  image_base64?: string;
  screenshot_path?: string;
}

export interface PersistedMessage {
  id: string;
  sessionId: string;
  role: "user" | "assistant";
  kind: AgentMessageKind;
  content: string;
  toolName: string | null;
  toolInput: unknown;
  toolResult: unknown;
  isError: boolean;
  seq: number;
  createdAt: Date;
}

export interface SessionSummary {
  id: string;
  title: string;
  screenContext: unknown;
  messageCount: number;
  lastUserMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionDetail {
  id: string;
  userId: string;
  title: string;
  screenContext: unknown;
  createdAt: Date;
  updatedAt: Date;
  messages: PersistedMessage[];
}

export interface AppendMessageInput {
  role: "user" | "assistant";
  kind?: AgentMessageKind;
  content: string;
  toolName?: string | null;
  toolInput?: unknown;
  toolResult?: unknown;
  isError?: boolean;
}

export interface AppendMessagesInput {
  sessionId: string;
  userId: string;
  screenContext?: AgentScreenContext;
  messages: AppendMessageInput[];
}

export class SessionNotFoundError extends Error {
  readonly code = "SESSION_NOT_FOUND";
  constructor(public readonly sessionId: string) {
    super(`agent session not found: ${sessionId}`);
  }
}

async function nextSeq(sessionId: string): Promise<number> {
  const last = await prisma.agentMessage.findFirst({
    where: { sessionId },
    orderBy: { seq: "desc" },
    select: { seq: true },
  });
  return (last?.seq ?? 0) + 1;
}

function toPersisted(row: {
  id: string;
  sessionId: string;
  role: string;
  kind: string;
  content: string;
  toolName: string | null;
  toolInput: unknown;
  toolResult: unknown;
  isError: boolean;
  seq: number;
  createdAt: Date;
}): PersistedMessage {
  return {
    id: row.id,
    sessionId: row.sessionId,
    role: row.role === "user" ? "user" : "assistant",
    kind: (row.kind as AgentMessageKind) ?? "message",
    content: row.content,
    toolName: row.toolName,
    toolInput: row.toolInput,
    toolResult: row.toolResult,
    isError: row.isError,
    seq: row.seq,
    createdAt: row.createdAt,
  };
}

export async function listSessions(userId: string): Promise<SessionSummary[]> {
  const sessions = await prisma.agentSession.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { messages: true } },
      messages: {
        where: { role: "user", kind: "message" },
        orderBy: { seq: "desc" },
        take: 1,
        select: { content: true },
      },
    },
  });
  return sessions.map((s) => ({
    id: s.id,
    title: s.title,
    screenContext: s.screenContext,
    messageCount: s._count.messages,
    lastUserMessage: s.messages[0]?.content ?? null,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  }));
}

export async function getSession(
  userId: string,
  sessionId: string,
): Promise<SessionDetail | null> {
  const row = await prisma.agentSession.findFirst({
    where: { id: sessionId, userId },
    include: { messages: { orderBy: { seq: "asc" } } },
  });
  if (!row) return null;
  return {
    id: row.id,
    userId: row.userId,
    title: row.title,
    screenContext: row.screenContext,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    messages: row.messages.map(toPersisted),
  };
}

export async function createSession(
  userId: string,
  screenContext?: AgentScreenContext,
): Promise<SessionDetail> {
  const created = await prisma.agentSession.create({
    data: {
      id: newSnowflakeId(),
      userId,
      screenContext: screenContext ? (screenContext as object) : undefined,
    },
    include: { messages: { orderBy: { seq: "asc" } } },
  });
  return {
    id: created.id,
    userId: created.userId,
    title: created.title,
    screenContext: created.screenContext,
    createdAt: created.createdAt,
    updatedAt: created.updatedAt,
    messages: [],
  };
}

export async function updateSessionTitle(
  userId: string,
  sessionId: string,
  title: string,
): Promise<SessionDetail | null> {
  const existing = await prisma.agentSession.findFirst({
    where: { id: sessionId, userId },
  });
  if (!existing) return null;
  await prisma.agentSession.update({
    where: { id: sessionId },
    data: { title: title.trim().slice(0, 120) },
  });
  const refreshed = await getSession(userId, sessionId);
  return refreshed;
}

export async function deleteSession(userId: string, sessionId: string): Promise<boolean> {
  const existing = await prisma.agentSession.findFirst({
    where: { id: sessionId, userId },
  });
  if (!existing) return false;
  await prisma.agentSession.delete({ where: { id: sessionId } });
  return true;
}

export async function appendMessages(input: AppendMessagesInput): Promise<PersistedMessage[]> {
  const { sessionId, userId, screenContext } = input;
  const messages = input.messages.filter((message) => message.content.trim() || message.kind === "tool_result");
  if (!messages.length) return [];

  const session = await prisma.agentSession.findFirst({
    where: { id: sessionId, userId },
    include: {
      messages: {
        where: { role: "user", kind: "message" },
        orderBy: { seq: "asc" },
        take: 1,
        select: { content: true },
      },
    },
  });
  if (!session) throw new SessionNotFoundError(sessionId);

  let seq = await nextSeq(sessionId);
  const rows: PersistedMessage[] = [];
  for (const message of messages) {
    const row = await prisma.agentMessage.create({
      data: {
        id: newSnowflakeId(),
        sessionId,
        role: message.role,
        kind: message.kind ?? "message",
        content: message.content,
        toolName: message.toolName ?? null,
        toolInput: (message.toolInput ?? undefined) as object | undefined,
        toolResult: (message.toolResult ?? undefined) as object | undefined,
        isError: Boolean(message.isError),
        seq,
      },
    });
    rows.push(toPersisted(row));
    seq += 1;
  }

  const firstUser = messages.find((message) => message.role === "user" && (message.kind ?? "message") === "message");
  const shouldSetTitle = !session.title && !session.messages[0]?.content && firstUser?.content.trim();
  await prisma.agentSession.update({
    where: { id: sessionId },
    data: {
      ...(screenContext ? { screenContext: screenContext as object } : {}),
      ...(shouldSetTitle
        ? { title: firstUser?.content.trim().split(/\s+/).slice(0, 12).join(" ").slice(0, 60) }
        : {}),
    },
  });

  return rows;
}
