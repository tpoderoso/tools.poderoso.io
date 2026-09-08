export function truncate(text: string, maxChars: number): string {
  return text.length <= maxChars ? text : `${text.slice(0, Math.max(0, maxChars - 1))}…`;
}

/** Quebra em até `maxLines` linhas de `perLine` caracteres, truncando o resto. */
export function wrap(text: string, perLine: number, maxLines: number): string[] {
  const out: string[] = [];
  let rest = text.trim();
  while (rest && out.length < maxLines) {
    if (rest.length <= perLine) {
      out.push(rest);
      rest = "";
      break;
    }
    const cut = rest.lastIndexOf(" ", perLine);
    const at = cut > perLine * 0.5 ? cut : perLine;
    out.push(rest.slice(0, at));
    rest = rest.slice(at).trim();
  }
  if (rest && out.length === maxLines) out[maxLines - 1] = truncate(`${out[maxLines - 1]} ${rest}`, perLine);
  return out;
}

// ponytail: self-check — roda no import (dev/build) e via `node lib/tools/c4/text.ts`
if (process.env.NODE_ENV !== "production") {
  const eq = (got: unknown, exp: unknown, what: string) => {
    if (JSON.stringify(got) !== JSON.stringify(exp))
      throw new Error(`c4/text ${what}: got ${JSON.stringify(got)} exp ${JSON.stringify(exp)}`);
  };

  // bug real: a última linha cabia inteira no perLine mas `rest` não era
  // zerado, e o bloco de "estourou as duas linhas" concatenava ela de novo
  eq(wrap("fila de mensagens do dominio", 20, 2), ["fila de mensagens do", "dominio"], "não duplica a última palavra");

  // mesma causa raiz, mas o duplicado ainda estourava perLine e truncava no
  // meio da palavra repetida ("que importa que importa" -> "que importa q…")
  eq(wrap("guarda tudo que importa", 14, 2), ["guarda tudo", "que importa"], "não trunca a última linha com lixo duplicado");

  eq(wrap("cabe numa linha", 30, 2), ["cabe numa linha"], "texto que cabe numa linha só não quebra");

  // aqui o texto estoura mesmo as duas linhas: o "…" é o comportamento certo
  eq(wrap("uma frase bem mais longa do que qualquer uma das duas linhas permite", 14, 2), ["uma frase bem", "mais longa do…"], "estouro de verdade ainda trunca com reticências");

  eq(truncate("abcde", 5), "abcde", "cabe exatamente no limite, sem truncar");
  eq(truncate("abcdef", 5), "abcd…", "um a mais já trunca");
}
