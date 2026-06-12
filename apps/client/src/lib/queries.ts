// All local CRUD queries — read/write the user's local SQLite via Tauri
// commands (Diesel-backed in Rust).
//
// The hooks signature is unchanged so views don't need to be touched.

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/db/client";
import {
  API_BASE,
  type ApiResponse,
  type LogRow as DomainLogRow,
  type TaskRow,
} from "@/lib/types";
import { newSnowflakeId } from "@/lib/snowflake";

/* ── Query keys ─────────────────────────────────────────────── */

export const queryKeys = {
  logs: ["logs"] as const,
  people: ["people"] as const,
  tasks: ["tasks"] as const,
  credits: (userId: string) => ["credits", userId] as const,
  stats: ["stats"] as const,
};

/* ── Cloud fetchers (auth + credits only) ──────────────────── */

async function fetchJson<T>(url: string): Promise<T> {
  const resp = await fetch(url, { credentials: "include" });
  if (!resp.ok) throw new Error(`GET ${url} failed: ${resp.status}`);
  const json = (await resp.json()) as ApiResponse<T>;
  if (!json.data) throw new Error(`GET ${url} returned no data`);
  return json.data;
}

/* ── Hooks ──────────────────────────────────────────────────── */

export function useLogs() {
  return useQuery({
    queryKey: queryKeys.logs,
    queryFn: async (): Promise<DomainLogRow[]> => {
      // Rust-side already joins each log with its most recent chat_turn
      // (turn_id, topic, person_id, partner_name). Map the raw row into
      // the domain LogRow shape (booleans + snake_case field names).
      const rows = await db.listLogsWithLastTurn(100);
      return rows.map((r) => ({
        id: r.id,
        occurred_at: r.occurred_at,
        app_name: r.app_name,
        app_bundle_id: r.app_bundle_id,
        is_send: r.is_send === 1,
        is_wechat: r.is_wechat === 1,
        screenshot_path: r.screenshot_path,
        turn_id: r.turn_id,
        topic: r.topic,
        partner_name: r.partner_name,
        person_id: r.person_id,
      }));
    },
    staleTime: 10_000,
    refetchOnWindowFocus: true,
  });
}

export function usePeople() {
  return useQuery({
    queryKey: queryKeys.people,
    queryFn: async () => {
      return await db.listPeople(undefined, 50);
    },
    staleTime: 10_000,
    refetchOnWindowFocus: true,
  });
}

function toDomainTask(r: {
  id: string;
  person_id: string | null;
  title: string;
  description: string;
  due_at: string | null;
  status: string;
  evidence: string;
  created_at: string;
  completed_at: string | null;
}): TaskRow {
  return {
    id: r.id,
    person_id: r.person_id,
    person_name: null, // resolved by view
    title: r.title,
    description: r.description,
    due_at: r.due_at,
    status: r.status as "pending" | "completed",
    evidence: r.evidence,
    created_at: r.created_at,
    completed_at: r.completed_at,
  };
}

export function useTasks() {
  return useQuery({
    queryKey: queryKeys.tasks,
    queryFn: async () => {
      const rows = await db.listTasks(undefined, 100);
      return rows.map(toDomainTask);
    },
    staleTime: 10_000,
    refetchOnWindowFocus: true,
  });
}

// credits is the only thing still on the cloud — it goes through the server.
export function useCredits(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.credits(userId ?? ""),
    queryFn: () =>
      fetchJson<{ balance: number }>(`${API_BASE}/credits/balance/${userId}`),
    enabled: !!userId,
    staleTime: 10_000,
    refetchOnWindowFocus: true,
  });
}

// Stats: one round-trip to Rust for all counts.
export function useStats() {
  return useQuery({
    queryKey: queryKeys.stats,
    queryFn: async () => {
      const s = await db.getStats();
      return {
        tasks: {
          total: s.tasks_total,
          pending: s.tasks_pending,
          completed: s.tasks_completed,
        },
        people: s.people,
        chat_turns: s.chat_turns,
        chat_messages: s.chat_messages,
        logs: s.logs,
        ai: {
          interactions: 0,
          reply_suggestions: 0,
          task_detections: 0,
          agent_messages: 0,
        },
        credits_used: 0,
        last_active_at: null,
      };
    },
    staleTime: 10_000,
    refetchOnWindowFocus: true,
  });
}

export function useLogSearch() {
  const queryClient = useQueryClient();
  return (_q?: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.logs });
  };
}

/* ── Mutations (all local) ──────────────────────────────────── */

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      title: string;
      description?: string;
      due_at?: string | null;
      person_id?: string | null;
      person_name?: string | null;
      evidence?: string;
      fingerprint?: string;
    }) => {
      const fp = input.fingerprint ?? newSnowflakeId();
      const existing = await db.getTaskByFingerprint(fp);
      if (existing) {
        return toDomainTask(existing);
      }
      const created = await db.createTask({
        id: newSnowflakeId(),
        title: input.title,
        description: input.description,
        dueAt: input.due_at,
        personId: input.person_id,
        evidence: input.evidence,
        fingerprint: fp,
      });
      return toDomainTask(created);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...body
    }: {
      id: string;
      title?: string;
      description?: string;
      due_at?: string | null;
      status?: "pending" | "completed";
    }) => {
      const updated = await db.updateTask({
        id,
        title: body.title,
        description: body.description,
        dueAt: body.due_at,
        status: body.status,
      });
      return toDomainTask(updated);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await db.deleteTask(id);
      return { ok: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats });
    },
  });
}

export function useDeletePerson() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await db.deletePerson(id);
      return { ok: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.people });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats });
    },
  });
}

export function useInvalidateAll() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.logs });
    queryClient.invalidateQueries({ queryKey: queryKeys.people });
    queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
    queryClient.invalidateQueries({ queryKey: ["credits"] });
    queryClient.invalidateQueries({ queryKey: queryKeys.stats });
  };
}
