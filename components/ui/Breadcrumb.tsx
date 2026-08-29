import Link from "next/link";

/**
 * O caminho da ferramenta como um `pwd` de terminal: `~/format/json` com cursor
 * piscando no fim, nas mesmas cores do `tools.poderoso.io` do header.
 *
 * Só o `~` é link, e leva pra home. A categoria não tem página própria, então
 * fica texto: mandar `generate` pro gerador de CPF seria prometer um índice da
 * categoria e entregar uma ferramenta qualquer dela. O último segmento é a página
 * atual e por isso também não é link, com `aria-current` dizendo isso.
 */
export function Breadcrumb({ path }: { path: string }) {
  const [category, tool] = path.slice(2).split("/");

  return (
    <nav aria-label="Você está aqui" className="crumb">
      <Link href="/" className="crumb-home" aria-label="Ir para a home">
        ~
      </Link>
      <span className="crumb-sep">/</span>
      <span className="crumb-dir">{category}</span>
      <span className="crumb-sep">/</span>
      <span className="crumb-here" aria-current="page">
        {tool}
      </span>
      <span className="crumb-caret" aria-hidden="true" />
    </nav>
  );
}
