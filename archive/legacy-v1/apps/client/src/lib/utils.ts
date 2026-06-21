import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(value: number | null | undefined, fallback = "—") {
  if (value == null || Number.isNaN(value)) return fallback;
  return new Intl.NumberFormat("en-US").format(value);
}
