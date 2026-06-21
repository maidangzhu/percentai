import { headers } from "next/headers";
import type { ApiResponse } from "@/lib/apiResponse";

function apiBaseUrl() {
  const configured = process.env.CMS_API_BASE_URL;
  if (configured) return configured.replace(/\/$/, "");
  if (process.env.NODE_ENV === "production") return "https://cms.thepercentai.com";
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3001";
}

export async function cmsApiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headerStore = await headers();
  const cookie = headerStore.get("cookie") ?? "";
  const resp = await fetch(`${apiBaseUrl()}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      ...(init.body ? { "content-type": "application/json" } : {}),
      ...(cookie ? { cookie } : {}),
      ...(init.headers ?? {}),
    },
  });
  const json = (await resp.json().catch(() => null)) as ApiResponse<T> | null;
  if (!resp.ok || !json || json.code !== 0) {
    throw new Error(json?.message ?? `CMS API ${path} failed with ${resp.status}`);
  }
  return json.data;
}
