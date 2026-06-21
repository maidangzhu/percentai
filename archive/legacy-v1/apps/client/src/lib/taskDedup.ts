// Client-side dedup for the analyze pipeline's task candidates.
// Loose compared to the server-side `isLikelyDuplicate`:
//   - same person + similarity ≥ 0.4 → suppress
//   - different person + similarity ≥ 0.7 → suppress
// The server already short-circuits obvious dupes; this catches anything it
// missed by scanning the local pending-task list.

import { taskTitleSimilarity } from "@percent/runtime";
import { db } from "@/db/client";
import type { TaskRow } from "@/lib/types";

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
  return (name ?? "").trim().replace(/\s+/g, "").toLowerCase();
}

export function isExistingTaskCandidate(
  candidate: DedupCandidate,
  existing: TaskRow[],
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
  const rows = await db.listTasks("pending", 1000);
  return rows.map((r) => ({
    id: r.id,
    person_id: r.person_id,
    person_name: null, // resolved by views
    title: r.title,
    description: r.description,
    due_at: r.due_at,
    status: r.status as "pending" | "completed",
    evidence: r.evidence,
    created_at: r.created_at,
    completed_at: r.completed_at,
  }));
}
