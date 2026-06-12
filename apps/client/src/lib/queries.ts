// All local CRUD queries — read/write the user's local SQLite via Prisma.
// LLM-driven ops (analyze/suggest/agent) still go through the cloud server;
// the cloud-only `credits` endpoint also stays on fetch.
//
// The hooks signature is unchanged so views don't need to be touched.

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { prisma } from "@/db/client";
import { API_BASE, type ApiResponse } from "@/lib/types";
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
    queryFn: async () => {
      const rows = await prisma.log.findMany({
        take: 100,
        orderBy: { occurredAt: "desc" },
        include: { chatTurns: { take: 1, orderBy: { id: "desc" } } },
      });
      return rows.map((r) => {
        const lastTurn = r.chatTurns[0];
        return {
          id: r.id,
          occurred_at: r.occurredAt.toISOString(),
          app_name: r.appName,
          app_bundle_id: r.appBundleId,
          is_send: r.isSend,
          is_wechat: r.isWechat,
          screenshot_path: r.screenshotPath,
          turn_id: lastTurn?.id ?? null,
          topic: lastTurn?.topic ?? null,
          partner_name: null,
          person_id: null,
        };
      });
    },
    staleTime: 10_000,
    refetchOnWindowFocus: true,
  });
}

export function usePeople() {
  return useQuery({
    queryKey: queryKeys.people,
    queryFn: async () => {
      const rows = await prisma.person.findMany({
        orderBy: { updatedAt: "desc" },
        include: {
          _count: { select: { chatTurns: true } },
        },
      });
      return rows.map((r) => ({
        id: r.id,
        name: r.name,
        client_app: r.clientApp,
        created_at: r.createdAt.toISOString(),
        updated_at: r.updatedAt.toISOString(),
        turn_count: r._count.chatTurns,
        last_chat_at: null,
      }));
    },
    staleTime: 10_000,
    refetchOnWindowFocus: true,
  });
}

export function useTasks() {
  return useQuery({
    queryKey: queryKeys.tasks,
    queryFn: async () => {
      const rows = await prisma.task.findMany({
        orderBy: [{ status: "asc" }, { dueAt: "asc" }],
      });
      return rows.map((r) => ({
        id: r.id,
        title: r.title,
        description: r.description,
        due_at: r.dueAt?.toISOString() ?? null,
        status: r.status as "pending" | "completed",
        person_id: r.personId,
        person_name: null, // resolved by view
        evidence: r.evidence,
        created_at: r.createdAt.toISOString(),
        completed_at: r.completedAt?.toISOString() ?? null,
      }));
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

// Stats: now local — count rows from each table.
export function useStats() {
  return useQuery({
    queryKey: queryKeys.stats,
    queryFn: async () => {
      const [tasks, people, turns, messages, logs] = await Promise.all([
        prisma.task.groupBy({ by: ["status"], _count: { _all: true } }),
        prisma.person.count(),
        prisma.chatTurn.count(),
        prisma.chatMessage.count(),
        prisma.log.count(),
      ]);
      const pending = tasks.find((t) => t.status === "pending")?._count._all ?? 0;
      const completed = tasks.find((t) => t.status === "completed")?._count._all ?? 0;
      return {
        tasks: { total: pending + completed, pending, completed },
        people,
        chat_turns: turns,
        chat_messages: messages,
        logs,
        ai: { interactions: 0, reply_suggestions: 0, task_detections: 0, agent_messages: 0 },
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
      const existing = await prisma.task.findUnique({ where: { fingerprint: fp } });
      if (existing) {
        return {
          id: existing.id,
          person_id: existing.personId,
          person_name: input.person_name ?? null,
          title: existing.title,
          description: existing.description,
          due_at: existing.dueAt?.toISOString() ?? null,
          status: existing.status as "pending" | "completed",
          evidence: existing.evidence,
          created_at: existing.createdAt.toISOString(),
          completed_at: existing.completedAt?.toISOString() ?? null,
        };
      }
      const created = await prisma.task.create({
        data: {
          id: newSnowflakeId(),
          title: input.title,
          description: input.description ?? "",
          dueAt: input.due_at ? new Date(input.due_at) : null,
          personId: input.person_id ?? null,
          evidence: input.evidence ?? "",
          fingerprint: fp,
        },
      });
      return {
        id: created.id,
        person_id: created.personId,
        person_name: input.person_name ?? null,
        title: created.title,
        description: created.description,
        due_at: created.dueAt?.toISOString() ?? null,
        status: created.status as "pending" | "completed",
        evidence: created.evidence,
        created_at: created.createdAt.toISOString(),
        completed_at: created.completedAt?.toISOString() ?? null,
      };
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
      const updated = await prisma.task.update({
        where: { id },
        data: {
          ...(body.title !== undefined && { title: body.title }),
          ...(body.description !== undefined && { description: body.description }),
          ...(body.due_at !== undefined && { dueAt: body.due_at ? new Date(body.due_at) : null }),
          ...(body.status !== undefined && {
            status: body.status,
            completedAt: body.status === "completed" ? new Date() : null,
          }),
        },
      });
      return updated;
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
      await prisma.task.delete({ where: { id } });
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
      await prisma.person.delete({ where: { id } });
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
