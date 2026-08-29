export type SqlTokenType = "keyword" | "string" | "number" | "comment" | "plain";
export interface SqlToken {
  text: string;
  type: SqlTokenType;
}

// ponytail: lista enxuta dos keywords comuns aos dialetos; adicione aqui se algo relevante sair sem cor
const KEYWORDS = new Set(
  (
    "SELECT FROM WHERE AND OR NOT NULL AS ON JOIN INNER LEFT RIGHT FULL OUTER CROSS " +
    "GROUP BY ORDER HAVING LIMIT OFFSET TOP DISTINCT UNION ALL EXCEPT INTERSECT " +
    "INSERT INTO VALUES UPDATE SET DELETE MERGE TRUNCATE " +
    "CREATE ALTER DROP TABLE VIEW INDEX SEQUENCE TRIGGER PROCEDURE FUNCTION RETURNS RETURN " +
    "PRIMARY FOREIGN KEY REFERENCES CONSTRAINT DEFAULT CHECK UNIQUE " +
    "CASE WHEN THEN ELSE END IF EXISTS BETWEEN IN LIKE IS ASC DESC " +
    "DECLARE BEGIN COMMIT ROLLBACK TRANSACTION WHILE LOOP FOR EACH ROW " +
    "WITH USING EXEC EXECUTE PRINT GRANT REVOKE OVER PARTITION " +
    "COUNT SUM MIN MAX AVG CAST CONVERT COALESCE ISNULL NVL NULLIF " +
    "SUBSTRING TRIM UPPER LOWER LENGTH LEN GETDATE NOW CURRENT_TIMESTAMP CURRENT_DATE " +
    "ROW_NUMBER RANK DENSE_RANK INT INTEGER BIGINT VARCHAR NVARCHAR CHAR TEXT DATE DATETIME " +
    "DECIMAL NUMERIC FLOAT BOOLEAN NUMBER"
  ).split(" ")
);

const TOKEN_RE =
  /(--[^\n]*|\/\*[\s\S]*?\*\/)|('(?:''|[^'])*'?)|([A-Za-z_@#][\w@#$]*)|(\d+(?:\.\d+)?)|([\s\S])/g;

function makePush<T extends string>(out: { text: string; type: T }[]) {
  return (text: string, type: T) => {
    const last = out[out.length - 1];
    if (last && last.type === type) last.text += text;
    else out.push({ text, type });
  };
}

/** Tokeniza SQL para syntax highlight: keywords, strings, números e comentários; o resto é `plain`. */
export function tokenizeSQL(s: string): SqlToken[] {
  const out: SqlToken[] = [];
  const push = makePush(out);
  for (const m of s.matchAll(TOKEN_RE)) {
    if (m[1]) push(m[1], "comment");
    else if (m[2]) push(m[2], "string");
    else if (m[3]) push(m[3], KEYWORDS.has(m[3].toUpperCase()) ? "keyword" : "plain");
    else if (m[4]) push(m[4], "number");
    else push(m[0], "plain");
  }
  return out;
}

export type MermaidTokenType = "keyword" | "arrow" | "string" | "comment" | "plain";
export interface MermaidToken {
  text: string;
  type: MermaidTokenType;
}

// ponytail: keywords comuns aos tipos de diagrama; adicione aqui se algo relevante sair sem cor
const MERMAID_KEYWORDS = new Set(
  (
    "graph flowchart sequencediagram classdiagram statediagram statediagram-v2 " +
    "erdiagram gantt pie journey gitgraph mindmap timeline quadrantchart " +
    "requirementdiagram c4context subgraph end participant actor class state note " +
    "over loop alt else opt par and rect activate deactivate direction section " +
    "title dateformat axisformat click callback link style linkstyle classdef " +
    "td lr rl bt tb"
  ).split(" ")
);

const MERMAID_RE =
  /(%%[^\n]*)|("(?:[^"\\]|\\.)*"?)|([A-Za-z_][\w-]*)|([-.=<>|]{2,})|([\s\S])/g;

/** Tokeniza Mermaid para syntax highlight: keywords, setas, strings e comentários; o resto é `plain`. */
export function tokenizeMermaid(s: string): MermaidToken[] {
  const out: MermaidToken[] = [];
  const push = makePush(out);
  for (const m of s.matchAll(MERMAID_RE)) {
    if (m[1]) push(m[1], "comment");
    else if (m[2]) push(m[2], "string");
    else if (m[3]) push(m[3], MERMAID_KEYWORDS.has(m[3].toLowerCase()) ? "keyword" : "plain");
    else if (m[4]) push(m[4], "arrow");
    else push(m[0], "plain");
  }
  return out;
}

export type XmlTokenType = "tag" | "attr" | "string" | "comment" | "plain";
export interface XmlToken {
  text: string;
  type: XmlTokenType;
}

/** Tokeniza XML para syntax highlight: nomes de tag, atributos, valores e comentários; texto é `plain`. */
export function tokenizeXML(s: string): XmlToken[] {
  const out: XmlToken[] = [];
  const push = makePush(out);
  for (const m of s.matchAll(/(<!--[\s\S]*?(?:-->|$))|(<[^>]*>?)|([^<]+)/g)) {
    if (m[1]) push(m[1], "comment");
    else if (m[2]) {
      // dentro da tag: primeiro identificador é o nome, os demais são atributos
      let first = true;
      for (const t of m[2].matchAll(/("[^"]*"?|'[^']*'?)|([A-Za-z_][\w:.-]*)|([\s\S])/g)) {
        if (t[1]) push(t[1], "string");
        else if (t[2]) {
          push(t[2], first ? "tag" : "attr");
          first = false;
        } else push(t[0], "plain");
      }
    } else push(m[3], "plain");
  }
  return out;
}

export type MarkdownTokenType = "heading" | "marker" | "code" | "strong" | "link" | "muted" | "plain";
export interface MarkdownToken {
  text: string;
  type: MarkdownTokenType;
}

const MARKDOWN_RE = new RegExp(
  [
    "(^ {0,3}#{1,6} .*$)", //                                 1  título
    "(^ {0,3}>.*$)", //                                       2  citação
    "(^ {0,3}(?:`{3,}|~{3,}).*$|^ {0,3}(?:-{3,}|\\*{3,}|_{3,})\\s*$)", // 3 cerca e régua
    "(^[ \\t]*(?:[-*+]|\\d{1,9}[.)])\\s)", //                    4  marcador de lista
    "(`[^`\\n]+`)", //                                        5  código inline
    "(\\*\\*[^*\\n]+\\*\\*|__[^_\\n]+__)", //                 6  forte
    "(!?\\[[^\\]\\n]*\\]\\([^)\\n]*\\))", //                  7  link e imagem
    "([\\s\\S])", //                                          8  resto
  ].join("|"),
  "gm",
);

/** Tokeniza markdown para o painel de fonte: títulos, marcadores, código, links e citações. */
export function tokenizeMarkdown(s: string): MarkdownToken[] {
  const out: MarkdownToken[] = [];
  const push = makePush(out);
  for (const m of s.matchAll(MARKDOWN_RE)) {
    if (m[1]) push(m[1], "heading");
    else if (m[2] || m[3]) push(m[2] || m[3], "muted");
    else if (m[4]) push(m[4], "marker");
    else if (m[5]) push(m[5], "code");
    else if (m[6]) push(m[6], "strong");
    else if (m[7]) push(m[7], "link");
    else push(m[0], "plain");
  }
  return out;
}

export type CodeTokenType = "keyword" | "type" | "string" | "number" | "comment" | "plain";
export interface CodeToken {
  text: string;
  type: CodeTokenType;
}

// ponytail: um set só pra TypeScript e C#, que se sobrepõem quase todo. Some algo aqui se sair sem cor.
const CODE_KEYWORDS = new Set(
  (
    "export import function const let var return if else for foreach while do switch case break continue " +
    "new typeof instanceof class interface extends implements public private protected static readonly " +
    "async await try catch finally throw true false null undefined this"
  ).split(" "),
);

const CODE_TYPES = new Set("string number boolean int long bool void char object byte decimal".split(" "));

// A ordem da alternância importa: comentário antes de tudo (senão `//` vira
// literal de regex), string antes de regex (senão o '/' do C# abre um).
const CODE_RE = new RegExp(
  [
    "(\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/)", //                         1 comentário
    "(\"(?:[^\"\\\\\\n]|\\\\.)*\"|'(?:[^'\\\\\\n]|\\\\.)*'|`(?:[^`\\\\]|\\\\.)*`)", // 2 string, char, template
    "(\\/(?:\\[[^\\]\\n]*\\]|\\\\.|[^\\\\\\/\\n])+\\/[gimsuy]*)", //     3 literal de regex
    "([A-Za-z_$][\\w$]*)", //                                            4 identificador
    "(\\d+(?:\\.\\d+)?)", //                                             5 número
    "([\\s\\S])", //                                                     6 resto
  ].join("|"),
  "g",
);

/**
 * Tokeniza TypeScript e C# para syntax highlight: keywords, tipos, strings,
 * números e comentários; o resto é `plain`.
 *
 * ponytail: é regex, não parser. Cobre o subconjunto que a documentação usa.
 * Divisão fora de comentário/string vira literal de regex por engano, então não
 * sirva código arbitrário do usuário por aqui; pra isso o caminho é um parser.
 */
export function tokenizeCode(s: string): CodeToken[] {
  const out: CodeToken[] = [];
  const push = makePush(out);
  for (const m of s.matchAll(CODE_RE)) {
    if (m[1]) push(m[1], "comment");
    else if (m[2] || m[3]) push(m[2] || m[3], "string");
    else if (m[4]) {
      push(m[4], CODE_KEYWORDS.has(m[4]) ? "keyword" : CODE_TYPES.has(m[4]) ? "type" : "plain");
    } else if (m[5]) push(m[5], "number");
    else push(m[0], "plain");
  }
  return out;
}

// ponytail: self-check no import (dev/build). Cobre os casos que a documentação
// de CPF/CNPJ usa de verdade e que a regex erraria primeiro.
if (process.env.NODE_ENV !== "production") {
  const typeOf = (src: string, needle: string) =>
    tokenizeCode(src).find((t) => t.text.includes(needle))?.type;

  const casos: [string, string, CodeTokenType][] = [
    ['const x = value.replace(/[.\\s-]/g, "");', "/[.\\s-]/g", "string"],
    ["if (/^\\d{11}$/.test(d)) return false;", "/^\\d{11}$/", "string"],
    ["// virou /regex/ dentro de comentario", "//", "comment"],
    ["if (c == '/' ) continue;", "'/'", "string"],
    ["export function f(): boolean {", "export", "keyword"],
    ["let sum = 0;", "0", "number"],
  ];
  for (const [src, needle, esperado] of casos) {
    const got = typeOf(src, needle);
    if (got !== esperado) {
      throw new Error(`tokenizeCode: "${needle}" saiu como ${got}, esperado ${esperado}`);
    }
  }
  // o tokenizer não pode perder nem inventar caractere
  const amostra = 'const r = (sum * 10) % 11; // ok\nvar s = "a\\"b";';
  if (tokenizeCode(amostra).map((t) => t.text).join("") !== amostra) {
    throw new Error("tokenizeCode: round-trip do texto quebrou");
  }
}

export type JsonTokenType = "key" | "string" | "number" | "boolean" | "null" | "plain";
export interface JsonToken {
  text: string;
  type: JsonTokenType;
}

// string seguida de dois-pontos é chave, não valor — é a única diferença entre as duas
const JSON_RE =
  /("(?:[^"\\]|\\.)*")(\s*:)?|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|\b(true|false)\b|\b(null)\b|([\s\S])/g;

/** Tokeniza JSON já formatado para syntax highlight: chave, string, número, booleano e null. */
export function tokenizeJSON(s: string): JsonToken[] {
  const out: JsonToken[] = [];
  const push = makePush(out);
  for (const m of s.matchAll(JSON_RE)) {
    if (m[1]) {
      push(m[1], m[2] ? "key" : "string");
      if (m[2]) push(m[2], "plain");
    } else if (m[3]) push(m[3], "number");
    else if (m[4]) push(m[4], "boolean");
    else if (m[5]) push(m[5], "null");
    else push(m[6], "plain");
  }
  return out;
}
