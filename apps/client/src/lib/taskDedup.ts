import { taskTitleSimilarity } from "@percent/runtime";
import { API_BASE } from "@/lib/types";
import type { ApiResponse, TaskRow } from "@/lib/types";

// 客户端 dedup — 比服务端的 isLikelyDuplicate 更宽松
// 命中规则：
//   - 同人 + 相似度 ≥ 0.4 → 抑制
//   - 不同人 + 相似度 ≥ 0.7 → 抑制
// 服务端命中后根本不会返回 task_candidate，这里只兜 AI 漏判的情况。
const SAME_PERSON_THRESHOLD = 0.4;
const CROSS_PERSON_THRESHOLD = 0.7;

export interface DedupCandidate {
  title: string;
  person_name?: string | null;
  due_at?: string | Date | null;
}

export interface DedupMatch {
  task: TaskRow;
  similarity: number;
  samePerson: boolean;
}

function normalizePersonName(name: string | null | undefined) {
  return (name ?? "").trim().replace(/\s+/g, "");
}

export function isExistingTaskCandidate(
  candidate: DedupCandidate,
  existing: TaskRow[]
): DedupMatch | null {
  if (!candidate.title?.trim() || !existing.length) return null;

  const candidatePerson = normalizePersonName(candidate.person_name);
  let best: DedupMatch | null = null;

  for (const task of existing) {
    if (!task.title) continue;
    const similarity = taskTitleSimilarity(candidate.title, task.title);
    const samePerson =
      Boolean(candidatePerson) &&
      normalizePersonName(task.person_name) === candidatePerson;
    const threshold = samePerson ? SAME_PERSON_THRESHOLD : CROSS_PERSON_THRESHOLD;
    if (similarity < threshold) continue;
    if (!best || similarity > best.similarity) {
      best = { task, similarity, samePerson };
    }
  }

  return best;
}

export async function fetchPendingTasks(): Promise<TaskRow[]> {
  const resp = await fetch(`${API_BASE}/tasks?status=pending`, {
    credentials: "include",
  });
  if (!resp.ok) return [];
  const json = (await resp.json()) as ApiResponse<TaskRow[]>;
  return Array.isArray(json.data) ? json.data : [];
}
