import type { ToolId } from "@/lib/nav";
import type { EstabId } from "@/lib/tools/company";

const FAVORITES_KEY = "tools.poderoso.io:favorites";
const USAGE_KEY = "tools.poderoso.io:usage";
const ESTAB_KEY = "tools.poderoso.io:empresa-tipo";

function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // quota estourada ou localStorage indisponível — falha silenciosa
  }
}

export function getFavorites(): ToolId[] {
  return readJSON<ToolId[]>(FAVORITES_KEY, []);
}

export function toggleFavorite(id: ToolId): ToolId[] {
  const current = getFavorites();
  const next = current.includes(id) ? current.filter((f) => f !== id) : [...current, id];
  writeJSON(FAVORITES_KEY, next);
  return next;
}

export function getEstablishmentType(): EstabId | "" {
  return readJSON<EstabId | "">(ESTAB_KEY, "");
}

export function setEstablishmentType(tipo: EstabId | ""): void {
  writeJSON(ESTAB_KEY, tipo);
}

export function getUsage(): Partial<Record<ToolId, number>> {
  return readJSON<Partial<Record<ToolId, number>>>(USAGE_KEY, {});
}

export function recordToolUse(id: ToolId): Partial<Record<ToolId, number>> {
  const current = getUsage();
  const next = { ...current, [id]: (current[id] ?? 0) + 1 };
  writeJSON(USAGE_KEY, next);
  return next;
}
