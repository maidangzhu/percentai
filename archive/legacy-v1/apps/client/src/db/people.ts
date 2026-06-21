// Local CRUD for the "people" / "contacts" entity. Replaces the old
// /people server routes — those don't exist on the cloud anymore.

import { db } from "./client";
import { newSnowflakeId } from "@/lib/snowflake";
import type { MergedPersonMessage, Message, PersonDetail, PersonSummary } from "@/lib/types";

export async function listPeople(opts?: {
  nameLike?: string;
  limit?: number;
}): Promise<PersonSummary[]> {
  const rows = await db.listPeople(opts?.nameLike, opts?.limit ?? 50);
  return rows.map((p) => ({
    id: p.id,
    name: p.name,
    client_app: p.client_app,
    created_at: p.created_at,
    updated_at: p.updated_at,
    turn_count: p.turn_count,
    last_chat_at: p.last_chat_at,
  }));
}

export async function getPerson(id: string): Promise<PersonDetail | null> {
  const detail = await db.getPerson(id);
  if (!detail) return null;
  // The Rust side returns raw `ChatMessageJson` (role: string). The
  // views expect `MergedPersonMessage` (role: "self" | "other") —
  // normalize here so the rest of the UI doesn't have to know about
  // the wire shape.
  const messages: MergedPersonMessage[] = detail.messages.map((m) => ({
    role: m.role === "self" ? "self" : "other",
    content: m.content,
  }));
  // Re-shape into the domain PersonDetail so views get a single
  // canonical type (`@/lib/types`) instead of the wire format.
  return {
    id: detail.id,
    name: detail.name,
    client_app: detail.client_app,
    created_at: detail.created_at,
    updated_at: detail.updated_at,
    turn_count: detail.turn_count,
    last_chat_at: detail.last_chat_at,
    messages,
    turns: detail.turns.map((t) => ({
      id: t.id,
      log_id: t.log_id,
      topic: t.topic,
      captured_at: t.captured_at,
      messages: t.messages.map((m) => ({
        role: m.role === "self" ? "self" : "other",
        content: m.content,
      })),
    })),
  };
}

/**
 * Look up a person by exact (case-insensitive, trimmed) name match. Used
 * by the analyze pipeline to hydrate recent chat context for a contact
 * that the frontmost-app heuristic has identified.
 */
export async function getPersonByName(
  name: string,
): Promise<PersonDetail | null> {
  if (!name?.trim()) return null;
  const matches = await listPeople({ nameLike: name.trim(), limit: 1 });
  const match = matches.find(
    (p) => p.name.trim().toLowerCase() === name.trim().toLowerCase(),
  );
  if (!match) return null;
  return getPerson(match.id);
}

export async function createPerson(opts: {
  name: string;
  clientApp?: string;
}): Promise<PersonSummary> {
  const row = await db.createPerson({
    id: newSnowflakeId(),
    name: opts.name,
    clientApp: opts.clientApp,
  });
  return {
    id: row.id,
    name: row.name,
    client_app: row.client_app,
    created_at: row.created_at,
    updated_at: row.updated_at,
    turn_count: row.turn_count,
    last_chat_at: row.last_chat_at,
  };
}

export async function deletePerson(id: string): Promise<void> {
  await db.deletePerson(id);
}

export type { Message };
