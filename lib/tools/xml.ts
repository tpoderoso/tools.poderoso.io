export function fmtXML(s: string): string {
  const r = s.replace(/>\s*</g, "><").trim();
  let out = "";
  let indent = 0;
  r.split(/(<[^>]+>)/g)
    .filter((t) => t.trim())
    .forEach((tok) => {
      if (/^<\//.test(tok)) {
        indent = Math.max(indent - 1, 0);
        out += "  ".repeat(indent) + tok + "\n";
      } else if (/^<[^!?/][^>]*[^/]>$/.test(tok)) {
        out += "  ".repeat(indent) + tok + "\n";
        indent++;
      } else {
        out += "  ".repeat(indent) + tok + "\n";
      }
    });
  return out.trim();
}
