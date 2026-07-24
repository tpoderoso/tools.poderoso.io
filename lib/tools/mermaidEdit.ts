// Formas de nó flowchart: delimitador de abertura -> fechamento. 2-char primeiro (têm prioridade na alternância).
const DELIMS: [string, string][] = [
  ["([", "])"],
  ["[[", "]]"],
  ["[(", ")]"],
  ["((", "))"],
  ["{{", "}}"],
  ["[", "]"],
  ["(", ")"],
  ["{", "}"],
  [">", "]"],
];

const OPEN_ALT = "\\(\\[|\\[\\[|\\[\\(|\\(\\(|\\{\\{|\\[|\\(|\\{|>";

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Troca o rótulo do nó `id` no código Mermaid (flowchart). Acha a primeira
 * definição `id<forma>...` e substitui o miolo pelo texto novo, sempre citado
 * ("...") pra não quebrar com caractere especial. Código inalterado se o nó não
 * for encontrado com uma forma conhecida.
 */
export function replaceNodeLabel(code: string, id: string, label: string): string {
  const re = new RegExp(`(^|[^\\w-])(${escapeRe(id)})(${OPEN_ALT})`, "g");
  let m: RegExpExecArray | null;
  while ((m = re.exec(code))) {
    const open = m[3];
    const pair = DELIMS.find(([o]) => o === open);
    if (!pair) continue;
    const contentStart = m.index + m[1].length + m[2].length + open.length;
    const end = code.indexOf(pair[1], contentStart);
    if (end === -1) continue;
    const quoted = `"${label.replace(/"/g, "&quot;")}"`;
    return code.slice(0, contentStart) + quoted + code.slice(end);
  }
  return code;
}

// ponytail: self-check — roda no import (dev/build); cobre as formas comuns e o caso "não achou"
if (process.env.NODE_ENV !== "production") {
  const t = (c: string, id: string, l: string, exp: string) => {
    const r = replaceNodeLabel(c, id, l);
    if (r !== exp) throw new Error(`mermaidEdit: ${JSON.stringify(r)} != ${JSON.stringify(exp)}`);
  };
  t("A[Old] --> B", "A", "New", 'A["New"] --> B');
  t("X --> A[Old]", "A", "New", 'X --> A["New"]');
  t("A([Old]) --> B", "A", "New", 'A(["New"]) --> B');
  t("A[(Old)]", "A", "New", 'A[("New")]');
  t("A{Old}", "A", "New", 'A{"New"}');
  t("A{{Old}}", "A", "New", 'A{{"New"}}');
  t("BA[keep] --> A[Old]", "A", "New", 'BA[keep] --> A["New"]'); // não confunde BA com A
  t("foo --> bar", "A", "New", "foo --> bar"); // ausente => inalterado
  t('A[x] with " quote', "A", 'a"b', 'A["a&quot;b"] with " quote'); // escapa aspas
}
