import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function tryParseJson<T = unknown>(raw: string): T | null {
  if (!raw) return null;
  let text = raw.trim();
  // Strip ```json fences if model added them despite instructions.
  if (text.startsWith("```")) {
    text = text.replace(/^```(json)?\s*/i, "").replace(/```\s*$/i, "");
  }
  // Try to slice the first {...} block.
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) {
    text = text.slice(start, end + 1);
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}
