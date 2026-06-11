import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API_BASE } from "@/lib/types";
import type { ApiResponse, LogRow, PersonSummary, TaskRow, UserStats } from "@/lib/types";

/* ── Query keys ─────────────────────────────────────────────── */

export const queryKeys = {
  logs: ["logs"] as const,
  people: ["people"] as const,
  tasks: ["tasks"] as const,
  credits: (userId: string) => ["credits", userId] as const,
  stats: ["stats"] as const,
};

/* ── Fetchers ───────────────────────────────────────────────── */

async function fetchJson<T>(url: string): Promise<T> {
  const resp = await fetch(url, { credentials: "include" });
  if (!resp.ok) throw new Error(`GET ${url} failed: ${resp.status}`);
  const json = (await resp.json()) as ApiResponse<T>;
  if (!json.data) throw new Error(`GET ${url} returned no data`);
  return json.data;
}

async function sendJson<T>(
  url: string,
  method: string,
  body?: unknown
): Promise<T> {
  const resp = await fetch(url, {
    method,
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!resp.ok) throw new Error(`${method} ${url} failed: ${resp.status}`);
  const json = (await resp.json()) as ApiResponse<T>;
  if (!json.data) throw new Error(`${method} ${url} returned no data`);
  return json.data;
}

/* ── Hooks ──────────────────────────────────────────────────── */

export function useLogs() {
  return useQuery({
    queryKey: queryKeys.logs,
    queryFn: () =>
      fetchJson<LogRow[]>(
        `${API_BASE}/logs?limit=100&offset=0`
      ),
    staleTime: 10_000,
    refetchOnWindowFocus: true,
  });
}

export function usePeople() {
  return useQuery({
    queryKey: queryKeys.people,
    queryFn: () => fetchJson<PersonSummary[]>(`${API_BASE}/people`),
    staleTime: 10_000,
    refetchOnWindowFocus: true,
  });
}

export function useTasks() {
  return useQuery({
    queryKey: queryKeys.tasks,
    queryFn: () => fetchJson<TaskRow[]>(`${API_BASE}/tasks`),
    staleTime: 10_000,
    refetchOnWindowFocus: true,
  });
}

export function useCredits(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.credits(userId ?? ""),
    queryFn: () =>
      fetchJson<{ balance: number }>(
        `${API_BASE}/credits/balance/${userId}`
      ),
    enabled: !!userId,
    staleTime: 10_000,
    refetchOnWindowFocus: true,
  });
}

export function useStats() {
  return useQuery({
    queryKey: queryKeys.stats,
    queryFn: () => fetchJson<UserStats>(`${API_BASE}/stats`),
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

/* ── Mutations ──────────────────────────────────────────────── */

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      title: string;
      description?: string;
      due_at?: string | null;
    }) =>
      sendJson<TaskRow>(`${API_BASE}/tasks`, "POST", {
        title: input.title,
        description: input.description,
        due_at: input.due_at ?? null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...body
    }: Partial<TaskRow> & { id: string }) =>
      sendJson<TaskRow>(`${API_BASE}/tasks/${id}`, "PATCH", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      sendJson<{ ok: boolean }>(`${API_BASE}/tasks/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
    },
  });
}

export function useDeletePerson() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      sendJson<{ ok: boolean }>(`${API_BASE}/people/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.people });
    },
  });
}

/**
 * Hook to access the query client for manual invalidation from event listeners.
 */
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
