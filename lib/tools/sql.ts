import { format, type FormatOptionsWithLanguage } from "sql-formatter";

const DIALECTS = ["sql", "transactsql", "plsql", "postgresql", "mysql"] as const;
type Dialect = (typeof DIALECTS)[number];

// acima disso o sql-formatter fica lento e estoura memória num arquivo só;
// fatiamos em statements e formatamos em blocos deste tamanho
const CHUNK_CHARS = 500_000;

function fmtOnce(s: string, language: Dialect): string {
  const opts: FormatOptionsWithLanguage = { language, keywordCase: "upper" };
  if (language === "sql") {
    // aceita parâmetros @Var (SQL Server), :var (Oracle) e $1/$var (Postgres) no dialeto genérico
    opts.paramTypes = { named: [":", "@", "$"], numbered: ["$"] };
  }
  return format(s, opts);
}

/** Tenta cada dialeto em ordem; retorna o texto formatado e o dialeto que aceitou. */
function fmtCascade(s: string, preferred?: Dialect): [string, Dialect] {
  const order = preferred
    ? [preferred, ...DIALECTS.filter((d) => d !== preferred)]
    : DIALECTS;
  let firstError: unknown;
  for (const language of order) {
    try {
      return [fmtOnce(s, language), language];
    } catch (e) {
      firstError ??= e;
    }
  }
  throw firstError;
}

/**
 * Divide SQL em statements no `;` de nível superior, ignorando `;` dentro de
 * strings ('' "" ``), [colchetes], comentários (-- e barra-asterisco) e dollar-quotes ($tag$...$tag$).
 * ponytail: não rastreia BEGIN...END — um bloco PL/SQL fatiado cai no fallback
 * por statement e sai menos indentado; rastrear blocos se isso incomodar.
 */
export function splitStatements(s: string): string[] {
  const out: string[] = [];
  const n = s.length;
  let start = 0;
  let i = 0;
  while (i < n) {
    const c = s[i];
    if (c === "'" || c === '"' || c === "`") {
      i++;
      while (i < n) {
        if (s[i] === c) {
          if (s[i + 1] === c) { i += 2; continue; } // '' escapado
          i++;
          break;
        }
        i++;
      }
    } else if (c === "[") {
      const close = s.indexOf("]", i + 1);
      i = close === -1 ? n : close + 1;
    } else if (c === "-" && s[i + 1] === "-") {
      const nl = s.indexOf("\n", i);
      i = nl === -1 ? n : nl + 1;
    } else if (c === "/" && s[i + 1] === "*") {
      const close = s.indexOf("*/", i + 2);
      i = close === -1 ? n : close + 2;
    } else if (c === "$") {
      const tag = /^\$[A-Za-z_][A-Za-z0-9_]*\$|^\$\$/.exec(s.slice(i, i + 64));
      if (tag) {
        const close = s.indexOf(tag[0], i + tag[0].length);
        i = close === -1 ? n : close + tag[0].length;
      } else {
        i++;
      }
    } else if (c === ";") {
      out.push(s.slice(start, i + 1));
      i++;
      start = i;
    } else {
      i++;
    }
  }
  if (s.slice(start).trim()) out.push(s.slice(start));
  return out;
}

/**
 * Formata SQL com keywords maiúsculas. Detecta o dialeto por tentativa
 * (genérico, T-SQL, PL/SQL, Postgres, MySQL), então @vars, [colchetes],
 * #temp, $1, backticks etc. formatam sem o usuário escolher nada.
 * Arquivos grandes são fatiados em statements e formatados em blocos para
 * não estourar memória; um trecho inválido fica como está em vez de
 * derrubar o arquivo inteiro. Throws apenas se o input inteiro for inválido.
 */
export function fmtSQL(s: string): string {
  if (s.length <= CHUNK_CHARS) return fmtCascade(s)[0];

  // agrupa statements em chunks de até CHUNK_CHARS
  const chunks: string[] = [];
  let current = "";
  for (const stmt of splitStatements(s)) {
    if (current && current.length + stmt.length > CHUNK_CHARS) {
      chunks.push(current);
      current = "";
    }
    current += stmt;
  }
  if (current) chunks.push(current);

  let dialect: Dialect | undefined; // gruda no dialeto do primeiro chunk que formatar
  const out = chunks.map((chunk) => {
    try {
      const [text, lang] = fmtCascade(chunk, dialect);
      dialect ??= lang;
      return text;
    } catch {
      // chunk falhou em todos os dialetos: tenta statement a statement,
      // mantendo intacto só o que realmente não parseia
      return splitStatements(chunk)
        .map((stmt) => {
          try {
            return fmtCascade(stmt, dialect)[0];
          } catch {
            return stmt.trim();
          }
        })
        .join("\n\n");
    }
  });
  return out.join("\n\n");
}
