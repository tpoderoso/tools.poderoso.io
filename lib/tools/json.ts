/** Parses and re-serializes JSON with 2-space indentation. Returns a `// Erro:` string instead of throwing. */
export function fmtJSON(s: string): string {
  try {
    return JSON.stringify(JSON.parse(s), null, 2);
  } catch (e) {
    return "// Erro: " + (e as Error).message;
  }
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
