/**
 * Converts a `curl` command line into an equivalent `fetch()` snippet.
 * Regex-based, not a real shell/curl parser — handles the common flags (`-X`, `-H`, `-d`/`--data*`)
 * with quoted single-line values; anything more exotic (multi-line data, `@file`, `-u`, etc.) is ignored.
 */
export function parseCurl(cmd: string): string {
  if (!cmd.trim()) return "";
  try {
    const s = cmd.replace(/\\\s*\n/g, " ").replace(/\s+/g, " ").trim();
    let method = "GET";
    const mMatch = s.match(/(?:-X|--request)\s+([A-Z]+)/i);
    if (mMatch) method = mMatch[1].toUpperCase();
    let url = "";
    const urlMatch = s.match(/https?:\/\/[^\s'"]+/);
    if (urlMatch) url = urlMatch[0].replace(/['"]$/, "");
    const headers: Record<string, string> = {};
    for (const m of s.matchAll(/(?:-H|--header)\s+['"]([^'"]+)['"]/g)) {
      const idx = m[1].indexOf(":");
      if (idx > 0) headers[m[1].slice(0, idx).trim()] = m[1].slice(idx + 1).trim();
    }
    let body: string | null = null;
    const bMatch = s.match(/(?:-d|--data(?:-raw|-binary)?)\s+['"]([^'"]*)['"]/);
    if (bMatch) {
      body = bMatch[1];
      if (method === "GET") method = "POST";
    }
    const hasOpts = method !== "GET" || Object.keys(headers).length > 0 || !!body;
    const lines = [`fetch('${url}'`];
    if (hasOpts) {
      lines[0] += ", {";
      if (method !== "GET") lines.push(`  method: '${method}',`);
      if (Object.keys(headers).length) {
        lines.push("  headers: {");
        Object.entries(headers).forEach(([k, v]) => lines.push(`    '${k}': '${v}',`));
        lines.push("  },");
      }
      if (body) {
        try {
          JSON.parse(body);
          lines.push(`  body: JSON.stringify(${body}),`);
        } catch {
          lines.push(`  body: '${body}',`);
        }
      }
      lines.push("}");
    }
    lines.push(")\n  .then(res => res.json())\n  .then(data => console.log(data))\n  .catch(err => console.error(err));");
    return lines.join("\n");
  } catch (e) {
    return "// Erro ao converter: " + (e as Error).message;
  }
}
