const REDACTED_KEYS = new Set([
  "authorization",
  "cookie",
  "set-cookie",
  "password",
  "token",
  "accessToken",
  "refreshToken",
  "idToken",
  "access_token",
  "refresh_token",
  "id_token",
]);

const LARGE_BINARY_KEYS = new Set([
  "image_base64",
  "imageBase64",
  "base64",
  "screenshot_base64",
  "screenshotBase64",
]);

const MAX_STRING_CHARS = 1200;
const MAX_ARRAY_ITEMS = 30;
const MAX_OBJECT_KEYS = 80;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value) && !(value instanceof Date);
}

function sanitizeString(value: string) {
  if (value.length <= MAX_STRING_CHARS) return value;
  return {
    truncated: true,
    chars: value.length,
    preview: value.slice(0, MAX_STRING_CHARS),
  };
}

export function sanitizeForLog(value: unknown, keyHint?: string): unknown {
  if (typeof keyHint === "string") {
    if (REDACTED_KEYS.has(keyHint)) return "[REDACTED]";
    if (LARGE_BINARY_KEYS.has(keyHint)) {
      return typeof value === "string"
        ? { redacted: true, chars: value.length }
        : "[REDACTED_BINARY]";
    }
  }

  if (value == null || typeof value === "number" || typeof value === "boolean") return value;
  if (typeof value === "bigint") return value.toString();
  if (value instanceof Date) return value.toISOString();
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
    };
  }
  if (typeof value === "string") return sanitizeString(value);

  if (Array.isArray(value)) {
    const items = value.slice(0, MAX_ARRAY_ITEMS).map((item) => sanitizeForLog(item));
    if (value.length > MAX_ARRAY_ITEMS) {
      items.push({ truncated: true, remaining: value.length - MAX_ARRAY_ITEMS });
    }
    return items;
  }

  if (isPlainObject(value)) {
    const entries = Object.entries(value);
    const output: Record<string, unknown> = {};
    for (const [key, child] of entries.slice(0, MAX_OBJECT_KEYS)) {
      output[key] = sanitizeForLog(child, key);
    }
    if (entries.length > MAX_OBJECT_KEYS) {
      output.__truncated_keys = entries.length - MAX_OBJECT_KEYS;
    }
    return output;
  }

  return String(value);
}

export function parseAndSanitizeJson(value: string) {
  try {
    return sanitizeForLog(JSON.parse(value));
  } catch {
    return sanitizeForLog(value);
  }
}

