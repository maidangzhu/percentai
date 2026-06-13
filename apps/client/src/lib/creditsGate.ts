import { useEffect, useState } from "react";
import { authFetch } from "@/lib/auth";
import { API_BASE, AUTH_BASE, type ApiResponse, type AuthUser } from "@/lib/types";

const CREDIT_SNAPSHOT_KEY = "percent.credits.snapshot";
const CREDIT_EVENT = "percent-credits-updated";
const CREDIT_STALE_MS = 10_000;

export interface CreditSnapshot {
  userId: string;
  balance: number;
  updatedAt: number;
}

function emitCreditUpdate() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CREDIT_EVENT));
}

export function loadCreditSnapshot(): CreditSnapshot | null {
  if (typeof localStorage === "undefined") return null;
  const raw = localStorage.getItem(CREDIT_SNAPSHOT_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<CreditSnapshot>;
    if (!parsed.userId || typeof parsed.balance !== "number") return null;
    return {
      userId: parsed.userId,
      balance: parsed.balance,
      updatedAt: typeof parsed.updatedAt === "number" ? parsed.updatedAt : 0,
    };
  } catch {
    return null;
  }
}

export function saveCreditSnapshot(userId: string, balance: number) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(
    CREDIT_SNAPSHOT_KEY,
    JSON.stringify({ userId, balance, updatedAt: Date.now() } satisfies CreditSnapshot),
  );
  emitCreditUpdate();
}

export function clearCreditSnapshot() {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(CREDIT_SNAPSHOT_KEY);
  emitCreditUpdate();
}

export function hasPositiveCreditsSnapshot() {
  const snapshot = loadCreditSnapshot();
  return snapshot != null && snapshot.balance > 0;
}

async function getSessionUser(): Promise<AuthUser | null> {
  const resp = await authFetch(`${AUTH_BASE}/get-session`);
  if (!resp.ok) return null;
  const session = (await resp.json().catch(() => null)) as { user?: AuthUser } | null;
  return session?.user ?? null;
}

export async function refreshCreditSnapshot(): Promise<CreditSnapshot | null> {
  const user = await getSessionUser();
  if (!user?.id) {
    clearCreditSnapshot();
    return null;
  }

  const resp = await authFetch(`${API_BASE}/credits/balance/${user.id}`);
  if (!resp.ok) throw new Error(`GET credits failed: ${resp.status}`);
  const json = (await resp.json()) as ApiResponse<{ balance: number }>;
  const balance = json.data?.balance;
  if (typeof balance !== "number") throw new Error("GET credits returned no balance");
  saveCreditSnapshot(user.id, balance);
  return loadCreditSnapshot();
}

export async function canUseAiCredits(): Promise<boolean> {
  const snapshot = loadCreditSnapshot();
  if (snapshot && Date.now() - snapshot.updatedAt < CREDIT_STALE_MS) {
    return snapshot.balance > 0;
  }
  try {
    const fresh = await refreshCreditSnapshot();
    return fresh != null && fresh.balance > 0;
  } catch {
    return snapshot != null && snapshot.balance > 0;
  }
}

export function useAiCreditsAvailable() {
  const [available, setAvailable] = useState(hasPositiveCreditsSnapshot);

  useEffect(() => {
    const sync = () => setAvailable(hasPositiveCreditsSnapshot());
    const onStorage = (event: StorageEvent) => {
      if (event.key === CREDIT_SNAPSHOT_KEY) sync();
    };
    window.addEventListener(CREDIT_EVENT, sync);
    window.addEventListener("storage", onStorage);
    void refreshCreditSnapshot().finally(sync);
    const interval = window.setInterval(() => {
      void refreshCreditSnapshot().finally(sync);
    }, 30_000);
    return () => {
      window.removeEventListener(CREDIT_EVENT, sync);
      window.removeEventListener("storage", onStorage);
      window.clearInterval(interval);
    };
  }, []);

  return available;
}
