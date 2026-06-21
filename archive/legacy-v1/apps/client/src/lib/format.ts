export function formatDateTime(value: string | null | undefined, fallback = "—") {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleString();
}

export function formatShortDate(value: string | null | undefined) {
  if (!value) return "—";
  return value.slice(0, 10);
}

export function formatTimeOnly(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function initials(name: string | null | undefined) {
  const trimmed = name?.trim() ?? "";
  if (!trimmed) return "·";
  return trimmed.charAt(0).toUpperCase();
}
