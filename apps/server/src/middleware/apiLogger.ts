import type { MiddlewareHandler } from "hono";
import { elapsedMs, logError, logInfo } from "../lib/appLogger.js";

function headersForLog(headers: Headers) {
  const output: Record<string, string> = {};
  for (const [key, value] of headers.entries()) {
    output[key] = value;
  }
  return output;
}

async function requestBodyForLog(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (!["POST", "PATCH", "PUT", "DELETE"].includes(request.method)) return undefined;
  if (!contentType.includes("application/json")) {
    return contentType ? { skipped: true, content_type: contentType } : undefined;
  }
  const body = await request.clone().json().catch(() => ({ unreadable: true }));
  return redactSecrets(body);
}

/**
 * Strip large / secret fields before logging so a `pnpm dev` run doesn't
 * dump the entire screenshot base64 (and any future api_key / token)
 * to stderr on every request.
 */
function redactSecrets(value: unknown): unknown {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(redactSecrets);
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    const key = k.toLowerCase();
    if (
      key === "image_base64" ||
      key === "image" ||
      key === "screenshot" ||
      key === "api_key" ||
      key === "apikey" ||
      key.endsWith("_base64") ||
      key === "data" ||
      key === "password" ||
      key === "token"
    ) {
      if (typeof v === "string") {
        out[k] = v.length > 80 ? `[redacted ${v.length} chars]` : "[redacted]";
      } else {
        out[k] = "[redacted]";
      }
    } else {
      out[k] = redactSecrets(v);
    }
  }
  return out;
}

async function responseBodyForLog(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return contentType ? { skipped: true, content_type: contentType } : undefined;
  }
  return await response.clone().json().catch(() => ({ unreadable: true }));
}

export function apiLogger(): MiddlewareHandler {
  return async (c, next) => {
    const startedAt = Date.now();
    const traceId = c.req.header("x-trace-id") ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    c.set("traceId", traceId);

    const url = new URL(c.req.url);
    const query = Object.fromEntries(url.searchParams.entries());
    const requestBody = await requestBodyForLog(c.req.raw);

    logInfo("http.request", {
      trace_id: traceId,
      method: c.req.method,
      path: c.req.path,
      query,
      headers: headersForLog(c.req.raw.headers),
      body: requestBody,
    });

    try {
      await next();
    } catch (error) {
      logError("http.error", {
        trace_id: traceId,
        method: c.req.method,
        path: c.req.path,
        error,
        duration_ms: elapsedMs(startedAt),
      });
      throw error;
    }

    logInfo("http.response", {
      trace_id: traceId,
      method: c.req.method,
      path: c.req.path,
      status: c.res.status,
      body: redactSecrets(await responseBodyForLog(c.res)),
      duration_ms: elapsedMs(startedAt),
    });
  };
}

