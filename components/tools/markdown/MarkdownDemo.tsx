import { parseMarkdown } from "@/lib/tools/markdown";
import { MarkdownDoc } from "./MarkdownDoc";
import styles from "./markdown.module.css";

/**
 * Amostra do manual: o Markdown cru em cima, o mesmo trecho renderizado embaixo.
 *
 * O resultado sai do próprio parser e do próprio renderizador da ferramenta, então
 * o que o manual mostra é literalmente o que o visualizador produz, sem risco de a
 * documentação envelhecer em relação ao código. Roda só no servidor (o manual é
 * server component), então nada disso vira JavaScript no navegador.
 */
export function MarkdownDemo({ src }: { src: string }) {
  return (
    <div className="tool-doc-demo">
      <span className="tool-doc-demo-tag">fonte</span>
      <pre className="tool-doc-demo-src">{src}</pre>

      <span className="tool-doc-demo-tag">resultado</span>
      <div
        className={`${styles.dark} ${styles.serif} ${styles.docInner}`}
        style={{
          padding: "14px 16px",
          gap: "0.8em",
          borderRadius: 10,
          border: "1px solid var(--color-border)",
          background: "var(--doc-bg)",
          color: "var(--doc-fg)",
          fontSize: 14,
        }}
      >
        <MarkdownDoc blocks={parseMarkdown(src).blocks} />
      </div>
    </div>
  );
}
