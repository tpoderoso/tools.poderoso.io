/** Estatísticas de um texto, todas derivadas numa passada só. */
export interface TextStats {
  chars: number;
  charsNoSpaces: number;
  words: number;
  lines: number;
  paragraphs: number;
  bytes: number;
  readingMin: number;
}

export function textStats(s: string): TextStats {
  const trimmed = s.trim();
  const words = trimmed ? trimmed.split(/\s+/).length : 0;
  return {
    chars: s.length,
    charsNoSpaces: s.replace(/\s/g, "").length,
    words,
    lines: s ? s.split("\n").length : 0,
    paragraphs: s.split(/\n\s*\n/).filter((p) => p.trim()).length,
    bytes: new TextEncoder().encode(s).length,
    readingMin: Math.ceil(words / 200), // ~200 palavras/min
  };
}

/** Formata bytes como "820 B" / "1.2 KB" / "3.4 MB". */
export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

const removeAccents = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");

/** Transformações nomeadas — cada uma pura, `string -> string`, encadeável. */
export const transforms: Record<string, (s: string) => string> = {
  // caixa
  upper: (s) => s.toUpperCase(),
  lower: (s) => s.toLowerCase(),
  title: (s) => s.toLowerCase().replace(/(^|\s)(\S)/g, (_, a, b) => a + b.toUpperCase()),
  sentence: (s) =>
    s.toLowerCase().replace(/(^\s*\p{L})|([.!?]\s+\p{L})/gu, (m) => m.toUpperCase()),
  swapCase: (s) =>
    [...s]
      .map((c) => (c === c.toLowerCase() ? c.toUpperCase() : c.toLowerCase()))
      .join(""),

  // limpeza
  removeSpaces: (s) => s.replace(/ /g, ""),
  removeTabs: (s) => s.replace(/\t/g, ""),
  collapseSpaces: (s) => s.replace(/[ \t]+/g, " "),
  trimLines: (s) =>
    s
      .split("\n")
      .map((l) => l.trim())
      .join("\n")
      .trim(),
  removeBlankLines: (s) =>
    s
      .split("\n")
      .filter((l) => l.trim())
      .join("\n"),
  joinLines: (s) => s.replace(/\s*\n\s*/g, " ").trim(),
  removeAccents,

  // linhas / outros
  reverse: (s) => [...s].reverse().join(""),
  sortAsc: (s) => s.split("\n").sort((a, b) => a.localeCompare(b, "pt-BR")).join("\n"),
  sortDesc: (s) => s.split("\n").sort((a, b) => b.localeCompare(a, "pt-BR")).join("\n"),
  dedupeLines: (s) => [...new Set(s.split("\n"))].join("\n"),
  slugify: (s) =>
    removeAccents(s)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, ""),
};

// ponytail: self-check dos casos não triviais. Roda no import em dev/build.
if (process.env.NODE_ENV !== "production") {
  const eq = (got: string, want: string, name: string) => {
    if (got !== want) throw new Error(`text.ts ${name}: ${JSON.stringify(got)} != ${JSON.stringify(want)}`);
  };
  eq(transforms.title("olá MUNDO cruel"), "Olá Mundo Cruel", "title");
  eq(transforms.sentence("olá. tudo bem? sim!"), "Olá. Tudo bem? Sim!", "sentence");
  eq(transforms.removeAccents("ação coração"), "acao coracao", "removeAccents");
  eq(transforms.slugify("Olá, Mundo Cruel!"), "ola-mundo-cruel", "slugify");
  eq(transforms.dedupeLines("a\nb\na\nc"), "a\nb\nc", "dedupeLines");
  eq(formatBytes(820), "820 B", "formatBytes B");
  eq(formatBytes(1536), "1.5 KB", "formatBytes KB");
  eq(formatBytes(3 * 1024 * 1024), "3.0 MB", "formatBytes MB");
  const st = textStats("um dois\n\ntrês");
  if (st.words !== 3 || st.paragraphs !== 2) throw new Error("text.ts textStats");
}
