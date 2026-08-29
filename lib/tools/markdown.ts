/**
 * Parser de markdown (subconjunto GFM) — sem React, sem DOM.
 *
 * Devolve uma AST em vez de HTML de propósito: o componente renderiza nó a nó
 * como elemento React, então texto colado nunca vira markup executável e não
 * precisamos de sanitizer. `href`/`src` passam por allowlist de esquema.
 */

export type Inline =
  | { t: "text"; v: string }
  | { t: "code"; v: string }
  | { t: "strong"; c: Inline[] }
  | { t: "em"; c: Inline[] }
  | { t: "del"; c: Inline[] }
  | { t: "link"; href: string; c: Inline[] }
  | { t: "img"; src: string; alt: string }
  | { t: "br" };

export type Align = "left" | "center" | "right";

export interface ListItem {
  blocks: Block[];
  /** null = item comum; true/false = checkbox marcado/desmarcado */
  task: boolean | null;
}

export type Block =
  | { t: "heading"; level: number; id: string; text: string; c: Inline[] }
  | { t: "para"; c: Inline[] }
  | { t: "code"; lang: string; v: string }
  | { t: "quote"; blocks: Block[] }
  | { t: "list"; ordered: boolean; start: number; items: ListItem[] }
  | { t: "table"; head: Inline[][]; rows: Inline[][][]; align: Align[] }
  | { t: "hr" };

export interface Heading {
  id: string;
  text: string;
  level: number;
}

export interface MarkdownDoc {
  blocks: Block[];
  headings: Heading[];
  words: number;
  minutes: number;
}

/** Palavras por minuto usadas no "~N min de leitura". */
const WPM = 200;

// ============ inline ============

const INLINE_SRC = [
    "(`+)([\\s\\S]*?)\\1", //                                  1,2  código
    "!\\[([^\\]]*)\\]\\(\\s*([^)\\s]*)[^)]*\\)", //            3,4  imagem
    "\\[([^\\]]*)\\]\\(\\s*([^)\\s]*)[^)]*\\)", //             5,6  link
    // os triplos vêm antes dos duplos: `**` é lazy e casaria `***a***` deixando
    // um asterisco solto de cada lado
    "\\*\\*\\*(?!\\s)([\\s\\S]+?)\\*\\*\\*", //             7    ***forte e ênfase***
    "___(?!\\s)([\\s\\S]+?)___", //                            8    ___forte e ênfase___
    "\\*\\*(?!\\s)([\\s\\S]+?)\\*\\*", //                      9    **forte**
    "__(?!\\s)([\\s\\S]+?)__", //                              10   __forte__
    "~~(?!\\s)([\\s\\S]+?)~~", //                              11   ~~riscado~~
    "\\*(?!\\s)([^*]+?)\\*", //                                12   *ênfase*
    "(?<![\\w])_(?!\\s)([^_]+?)_(?![\\w])", //                 13   _ênfase_
    "<((?:https?|mailto):[^>\\s]+)>", //                       14   <autolink>
    "(?<![(\"'\\w])(https?:\\/\\/[^\\s<>()\\[\\]]+)", //       15   url solta
    "( {2,}\\n|\\\\\\n)", //                                   16   quebra forte
].join("|");

/**
 * Allowlist de esquema. URL relativa ou âncora passa; com esquema, só
 * http/https/mailto (mais `data:image/` quando `img`). Bloqueia `javascript:`.
 */
function safeUrl(raw: string, img = false): string {
  const url = raw.trim();
  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(url);
  if (!scheme) return url;
  if (/^(https?|mailto)$/i.test(scheme[1])) return url;
  if (img && /^data:image\//i.test(url)) return url;
  return "#";
}

function pushText(out: Inline[], raw: string) {
  if (!raw) return;
  // quebra simples dentro do parágrafo é espaço (as fortes viram nó `br`)
  const v = raw.replace(/\n/g, " ");
  const last = out[out.length - 1];
  if (last?.t === "text") last.v += v;
  else out.push({ t: "text", v });
}

export function parseInline(src: string): Inline[] {
  const out: Inline[] = [];
  let last = 0;
  // regex nova por chamada: `parseInline` recorre e um `lastIndex` compartilhado
  // seria sobrescrito pela chamada de dentro
  const re = new RegExp(INLINE_SRC, "g");
  for (let m = re.exec(src); m; m = re.exec(src)) {
    pushText(out, src.slice(last, m.index));
    last = m.index + m[0].length;

    if (m[1] !== undefined) out.push({ t: "code", v: m[2].trim() });
    else if (m[3] !== undefined) out.push({ t: "img", src: safeUrl(m[4], true), alt: m[3] });
    else if (m[5] !== undefined) out.push({ t: "link", href: safeUrl(m[6]), c: parseInline(m[5]) });
    else if (m[7] !== undefined) out.push({ t: "strong", c: [{ t: "em", c: parseInline(m[7]) }] });
    else if (m[8] !== undefined) out.push({ t: "strong", c: [{ t: "em", c: parseInline(m[8]) }] });
    else if (m[9] !== undefined) out.push({ t: "strong", c: parseInline(m[9]) });
    else if (m[10] !== undefined) out.push({ t: "strong", c: parseInline(m[10]) });
    else if (m[11] !== undefined) out.push({ t: "del", c: parseInline(m[11]) });
    else if (m[12] !== undefined) out.push({ t: "em", c: parseInline(m[12]) });
    else if (m[13] !== undefined) out.push({ t: "em", c: parseInline(m[13]) });
    else if (m[14] !== undefined) out.push({ t: "link", href: safeUrl(m[14]), c: [{ t: "text", v: m[14] }] });
    else if (m[15] !== undefined) out.push({ t: "link", href: safeUrl(m[15]), c: [{ t: "text", v: m[15] }] });
    else out.push({ t: "br" });
  }
  pushText(out, src.slice(last));
  return out;
}

/** Texto puro de uma sequência inline — usado no slug do título e na contagem. */
export function inlineText(nodes: Inline[]): string {
  return nodes
    .map((n) => {
      if (n.t === "text" || n.t === "code") return n.v;
      if (n.t === "img") return n.alt;
      if (n.t === "br") return " ";
      return inlineText(n.c);
    })
    .join("");
}

// ============ blocos ============

const FENCE = /^ {0,3}(`{3,}|~{3,})\s*([^\s`]*)/;
const ATX = /^ {0,3}(#{1,6})\s+(.*?)\s*#*\s*$/;
const HR = /^ {0,3}(?:-{3,}|\*{3,}|_{3,})\s*$/;
const QUOTE = /^ {0,3}> ?(.*)$/;
const BULLET = /^(\s*)([-*+]|\d{1,9}[.)])(\s+)(.*)$/;
const SETEXT = /^ {0,3}(=+|-+)\s*$/;
const TASK = /^\[([ xX])\]\s+(.*)$/;

function isTableDelim(line: string | undefined): boolean {
  return !!line && /^[\s|:-]+$/.test(line) && line.includes("-") && line.includes("|");
}

function splitRow(line: string): string[] {
  let s = line.trim();
  if (s.startsWith("|")) s = s.slice(1);
  if (s.endsWith("|")) s = s.slice(0, -1);
  return s.split("|").map((c) => c.trim());
}

function leading(line: string): number {
  return line.length - line.trimStart().length;
}

function startsBlock(line: string, next: string | undefined): boolean {
  return (
    FENCE.test(line) ||
    ATX.test(line) ||
    HR.test(line) ||
    QUOTE.test(line) ||
    BULLET.test(line) ||
    (line.includes("|") && isTableDelim(next))
  );
}

interface Ctx {
  used: Set<string>;
  headings: Heading[];
}

function slug(text: string, ctx: Ctx): string {
  const base =
    text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "secao";
  let id = base;
  for (let n = 2; ctx.used.has(id); n++) id = `${base}-${n}`;
  ctx.used.add(id);
  return id;
}

function heading(level: number, src: string, ctx: Ctx): Block {
  const c = parseInline(src);
  const text = inlineText(c);
  const id = slug(text, ctx);
  ctx.headings.push({ id, text, level });
  return { t: "heading", level, id, text, c };
}

function makeItem(raw: string[], ctx: Ctx): ListItem {
  const tm = TASK.exec(raw[0] ?? "");
  const lines = tm ? [tm[2], ...raw.slice(1)] : raw;
  return { blocks: parseBlocks(lines, ctx), task: tm ? tm[1].toLowerCase() === "x" : null };
}

function parseList(lines: string[], start: number, ctx: Ctx): [Block, number] {
  const first = BULLET.exec(lines[start])!;
  const indent = first[1].length;
  const ordered = /\d/.test(first[2]);
  const startNum = ordered ? parseInt(first[2], 10) : 1;
  const items: ListItem[] = [];
  let i = start;

  while (i < lines.length) {
    const m = BULLET.exec(lines[i]);
    if (!m || m[1].length !== indent || /\d/.test(m[2]) !== ordered) break;

    const contentIndent = m[1].length + m[2].length + m[3].length;
    const raw = [m[4]];
    i++;

    while (i < lines.length) {
      const line = lines[i];
      if (!line.trim()) {
        // linha em branco só fica no item se o item (ou a lista) continuar depois
        const after = lines[i + 1] ?? "";
        const am = BULLET.exec(after);
        const goesOn = after.trim() && (leading(after) >= contentIndent || (am && am[1].length === indent));
        if (!goesOn) break;
        raw.push("");
        i++;
        continue;
      }
      if (leading(line) >= contentIndent) {
        raw.push(line.slice(contentIndent));
        i++;
        continue;
      }
      break;
    }

    items.push(makeItem(raw, ctx));
  }

  return [{ t: "list", ordered, start: startNum, items }, i];
}

function parseBlocks(lines: string[], ctx: Ctx): Block[] {
  const out: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }

    const f = FENCE.exec(line);
    if (f) {
      const ch = f[1][0];
      const len = f[1].length;
      const body: string[] = [];
      i++;
      while (i < lines.length) {
        const t = lines[i].trim();
        if (t.length >= len && [...t].every((c) => c === ch)) break;
        body.push(lines[i]);
        i++;
      }
      i++; // consome o fechamento (ou passa do fim, sem fechamento)
      out.push({ t: "code", lang: f[2] || "", v: body.join("\n") });
      continue;
    }

    const h = ATX.exec(line);
    if (h) {
      out.push(heading(h[1].length, h[2], ctx));
      i++;
      continue;
    }

    if (HR.test(line)) {
      out.push({ t: "hr" });
      i++;
      continue;
    }

    if (QUOTE.test(line)) {
      const inner: string[] = [];
      while (i < lines.length) {
        const q = QUOTE.exec(lines[i]);
        if (!q) break;
        inner.push(q[1]);
        i++;
      }
      out.push({ t: "quote", blocks: parseBlocks(inner, ctx) });
      continue;
    }

    if (BULLET.test(line)) {
      const [list, next] = parseList(lines, i, ctx);
      out.push(list);
      i = next;
      continue;
    }

    if (line.includes("|") && isTableDelim(lines[i + 1])) {
      const head = splitRow(line).map(parseInline);
      const align: Align[] = splitRow(lines[i + 1]).map((c) =>
        c.startsWith(":") && c.endsWith(":") ? "center" : c.endsWith(":") ? "right" : "left",
      );
      const rows: Inline[][][] = [];
      i += 2;
      while (i < lines.length && lines[i].trim() && lines[i].includes("|")) {
        rows.push(splitRow(lines[i]).map(parseInline));
        i++;
      }
      out.push({ t: "table", head, rows, align });
      continue;
    }

    // parágrafo: acumula até linha em branco, outro bloco ou sublinhado setext
    const buf: string[] = [];
    while (i < lines.length) {
      const l = lines[i];
      if (!l.trim()) break;
      const s = buf.length ? SETEXT.exec(l) : null;
      if (s) {
        out.push(heading(s[1][0] === "=" ? 1 : 2, buf.join(" "), ctx));
        buf.length = 0;
        i++;
        break;
      }
      if (startsBlock(l, lines[i + 1])) break;
      buf.push(l);
      i++;
    }
    if (buf.length) out.push({ t: "para", c: parseInline(buf.join("\n")) });
  }

  return out;
}

// ============ estatísticas ============

function countWords(blocks: Block[]): number {
  let n = 0;
  const add = (nodes: Inline[]) => {
    const words = inlineText(nodes).trim().split(/\s+/).filter(Boolean);
    n += words.length;
  };
  for (const b of blocks) {
    if (b.t === "heading" || b.t === "para") add(b.c);
    else if (b.t === "quote") n += countWords(b.blocks);
    else if (b.t === "list") for (const it of b.items) n += countWords(it.blocks);
    else if (b.t === "table") {
      b.head.forEach(add);
      b.rows.forEach((r) => r.forEach(add));
    }
    // bloco de código não conta: ninguém "lê" código a 200 palavras por minuto
  }
  return n;
}

// ============ entrada ============

export function parseMarkdown(src: string): MarkdownDoc {
  let lines = src.replace(/\r\n?/g, "\n").replace(/\t/g, "    ").split("\n");

  // ponytail: front matter YAML é descartado, não renderizado como lixo no topo
  if (lines[0]?.trim() === "---") {
    const end = lines.findIndex((l, k) => k > 0 && l.trim() === "---");
    if (end > 0) lines = lines.slice(end + 1);
  }

  const ctx: Ctx = { used: new Set(), headings: [] };
  const blocks = parseBlocks(lines, ctx);
  const words = countWords(blocks);

  return { blocks, headings: ctx.headings, words, minutes: Math.max(1, Math.round(words / WPM)) };
}

// ponytail: self-check no import em dev/build — quebra cedo se o parser regredir.
if (process.env.NODE_ENV !== "production") {
  const ok = (cond: boolean, msg: string) => {
    if (!cond) throw new Error(`markdown: ${msg}`);
  };

  const doc = parseMarkdown(
    [
      "---",
      "title: descartado",
      "---",
      "# Título",
      "",
      "Texto **forte**, *ênfase*, `code` e [link](https://ex.dev).",
      "",
      "Sublinhado",
      "==========",
      "",
      "- item",
      "  - aninhado",
      "- [x] feito",
      "",
      "> citação",
      "",
      "| a | b |",
      "| --- | ---: |",
      "| 1 | 2 |",
      "",
      "```js",
      "const x = 1;",
      "```",
      "",
      "---",
    ].join("\n"),
  );

  const kinds = doc.blocks.map((b) => b.t).join(",");
  ok(kinds === "heading,para,heading,list,quote,table,code,hr", `blocos inesperados: ${kinds}`);
  ok(doc.headings.length === 2 && doc.headings[0].id === "titulo", "títulos/slug errados");

  const para = doc.blocks[1] as Extract<Block, { t: "para" }>;
  ok(para.c.map((n) => n.t).join(",") === "text,strong,text,em,text,code,text,link,text", "inline errado");

  const list = doc.blocks[3] as Extract<Block, { t: "list" }>;
  ok(list.items.length === 2, "lista devia ter 2 itens de topo");
  ok(list.items[0].blocks.some((b) => b.t === "list"), "item 1 devia conter lista aninhada");
  ok(list.items[1].task === true, "item 2 devia ser checkbox marcado");

  const table = doc.blocks[5] as Extract<Block, { t: "table" }>;
  ok(table.align.join(",") === "left,right" && table.rows.length === 1, "tabela errada");

  const code = doc.blocks[6] as Extract<Block, { t: "code" }>;
  ok(code.lang === "js" && code.v === "const x = 1;", "bloco de código errado");

  // link hostil não pode sobreviver ao parser
  const evil = parseMarkdown("[x](javascript:alert(1))").blocks[0] as Extract<Block, { t: "para" }>;
  ok((evil.c[0] as Extract<Inline, { t: "link" }>).href === "#", "javascript: devia virar #");

  // ênfases: é onde a ordem das alternativas do regex importa. `***a***` já saiu
  // quebrado uma vez, porque o `**` lazy casava primeiro e sobrava um asterisco.
  const forma = (src: string) => JSON.stringify(parseInline(src), (k, v) => (k === "v" ? undefined : v));
  const triplo = '[{"t":"strong","c":[{"t":"em","c":[{"t":"text"}]}]}]';
  for (const [src, esperado] of [
    ["***a***", triplo],
    ["___a___", triplo],
    ["**a**", '[{"t":"strong","c":[{"t":"text"}]}]'],
    ["*a*", '[{"t":"em","c":[{"t":"text"}]}]'],
    ["~~a~~", '[{"t":"del","c":[{"t":"text"}]}]'],
    ["minha_variavel_longa", '[{"t":"text"}]'],
  ] as const) {
    ok(forma(src) === esperado, `parseInline("${src}") virou ${forma(src)}`);
  }
}

