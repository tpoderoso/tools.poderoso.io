/** Parses and re-serializes JSON with 2-space indentation. Throws on invalid JSON (caller catches and toasts). */
export function fmtJSON(s: string): string {
  return JSON.stringify(JSON.parse(s), null, 2);
}

export type JsonParseResult = { ok: true; value: unknown } | { ok: false; error: string };

/** Like {@link fmtJSON} but returns a typed result instead of a string, for callers that need the parsed value (e.g. the tree viewer) rather than formatted text. */
export function tryParseJson(s: string): JsonParseResult {
  try {
    return { ok: true, value: JSON.parse(s) };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
