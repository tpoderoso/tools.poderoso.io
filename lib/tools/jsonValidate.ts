export type JsonValidation =
  | { ok: true }
  | { ok: false; line: number; column: number; message: string; fixed: string | null };

const TRANSLATIONS: [RegExp, string | ((m: RegExpMatchArray) => string)][] = [
  [/Expected double-quoted property name/i, "nome de propriedade deve usar aspas duplas"],
  [/Expected property name or '}'/i, 'esperado nome de propriedade ou "}" — vírgula sobrando?'],
  [/Expected ',' or '}'/i, 'esperado "," ou "}" após o valor da propriedade'],
  [/Expected ',' or ']'/i, 'esperado "," ou "]" após o elemento do array'],
  [/Expected ':'/i, 'esperado ":" após o nome da propriedade'],
  [/Unterminated string/i, "string sem aspas de fechamento"],
  [/Bad control character/i, "caractere de controle dentro de string — quebra de linha sem escape?"],
  [/Unexpected end of (JSON input|data)|end of input/i, "fim inesperado do JSON — chave, colchete ou aspas sem fechar"],
  [/non-whitespace character after JSON/i, "conteúdo extra após o fim do JSON"],
  [/Unexpected token '?([^',\s]+)'?|unexpected character '?(.)'?/i, (m) => `caractere inesperado "${m[1] ?? m[2]}"`],
];

function translate(raw: string): string {
  for (const [re, msg] of TRANSLATIONS) {
    const m = raw.match(re);
    if (m) return typeof msg === "string" ? msg : msg(m);
  }
  return raw;
}

function lineColOf(s: string, pos: number): { line: number; column: number } {
  const upTo = s.slice(0, pos);
  return { line: upTo.split("\n").length, column: pos - upTo.lastIndexOf("\n") };
}

/** Validates JSON; on failure reports line/column, a pt-BR message and (when possible) an auto-repaired, formatted version. */
export function validateJson(s: string): JsonValidation {
  try {
    JSON.parse(s);
    return { ok: true };
  } catch (e) {
    const raw = (e as Error).message;
    let line = 1;
    let column = 1;
    let m = raw.match(/line (\d+) column (\d+)/);
    if (m) {
      line = +m[1];
      column = +m[2];
    } else if ((m = raw.match(/position (\d+)/))) {
      ({ line, column } = lineColOf(s, +m[1]));
    } else if (/end of/i.test(raw)) {
      ({ line, column } = lineColOf(s, s.length));
    }
    return { ok: false, line, column, message: translate(raw), fixed: repairJson(s) };
  }
}

/** Applies `fn` only to the segments outside double-quoted string literals. */
function mapOutsideStrings(s: string, fn: (seg: string) => string): string {
  return s
    .split(/("(?:[^"\\]|\\.)*")/)
    .map((seg, i) => (i % 2 ? seg : fn(seg)))
    .join("");
}

/**
 * Best-effort repair of almost-JSON: smart/single quotes, unquoted keys, trailing commas,
 * comments, raw newlines in strings, Python/JS literals and unclosed brackets.
 * Returns the fixed JSON formatted with 2 spaces, or null if still unparseable.
 */
// ponytail: doesn't infer missing commas between properties; add a token-level pass if that shows up often
export function repairJson(src: string): string | null {
  const s = src.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");

  // pass 1: char scan — normalize strings to double quotes, strip comments, track open brackets
  let out = "";
  const stack: string[] = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === '"' || c === "'") {
      let str = '"';
      i++;
      while (i < s.length && s[i] !== c) {
        if (s[i] === "\\") {
          str += s[i] + (s[i + 1] ?? "");
          i += 2;
        } else if (s[i] === '"') {
          str += '\\"';
          i++;
        } else if (s[i] === "\n") {
          str += "\\n";
          i++;
        } else {
          str += s[i++];
        }
      }
      i++;
      out += str + '"';
    } else if (c === "/" && s[i + 1] === "/") {
      while (i < s.length && s[i] !== "\n") i++;
    } else if (c === "/" && s[i + 1] === "*") {
      i += 2;
      while (i < s.length && !(s[i] === "*" && s[i + 1] === "/")) i++;
      i += 2;
    } else {
      if (c === "{" || c === "[") stack.push(c === "{" ? "}" : "]");
      else if (c === "}" || c === "]") stack.pop();
      out += c;
      i++;
    }
  }
  out += stack.reverse().join("");

  // pass 2: structural fixes outside strings
  out = mapOutsideStrings(out, (seg) =>
    seg
      .replace(/,(\s*[}\]])/g, "$1")
      .replace(/([{,]\s*)([A-Za-z_$][\w$]*)(\s*:)/g, '$1"$2"$3')
      .replace(/\bTrue\b/g, "true")
      .replace(/\bFalse\b/g, "false")
      .replace(/\b(None|undefined|NaN)\b/g, "null"),
  );

  try {
    return JSON.stringify(JSON.parse(out), null, 2);
  } catch {
    return null;
  }
}
