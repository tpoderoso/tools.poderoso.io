import { Fragment, type ReactNode } from "react";
import { tokenizeCode } from "@/lib/tools/highlight";
import { MarkdownDemo } from "@/components/tools/markdown/MarkdownDemo";
import type { ToolDocContent } from "@/lib/toolDocs";

// ponytail: só link inline `[texto](url)`. O conteúdo é nosso e controlado, então
// não vale puxar lib/tools/markdown.ts (parser inteiro) pro bundle de toda página.
const LINK = /\[([^\]]+)\]\(([^)]+)\)/g;

function prose(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;

  for (const m of text.matchAll(LINK)) {
    const at = m.index;
    if (at > last) out.push(<Fragment key={`t${last}`}>{text.slice(last, at)}</Fragment>);
    out.push(
      <a key={`a${at}`} href={m[2]} target="_blank" rel="noopener noreferrer">
        {m[1]}
      </a>,
    );
    last = at + m[0].length;
  }

  if (last < text.length) out.push(<Fragment key={`t${last}`}>{text.slice(last)}</Fragment>);
  return out;
}

const slug = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/**
 * Abas de linguagem para a mesma implementação.
 *
 * Radios escondidos e `:checked ~`, igual às abas da página: sem JavaScript e com
 * as duas versões no HTML servido, então o Google indexa TypeScript e C#.
 * O CSS casa por `nth-of-type`, não pelo id, pra não amarrar o estilo à linguagem.
 */
function CodeTabs({ group, blocks }: { group: string; blocks: ToolDocContent["sections"][number]["code"] }) {
  if (!blocks?.length) return null;

  return (
    <div className="tool-doc-code">
      {blocks.map((b, i) => (
        <input
          key={b.id}
          type="radio"
          name={group}
          id={`${group}-${b.id}`}
          defaultChecked={i === 0}
          className="tool-tab-input"
        />
      ))}

      <div className="tool-doc-langs">
        {blocks.map((b) => (
          <label key={b.id} htmlFor={`${group}-${b.id}`}>
            {b.lang}
          </label>
        ))}
      </div>

      {blocks.map((b) => (
        <pre key={b.id}>
          <code>
            {tokenizeCode(b.src).map((t, i) => (
              <span key={i} className={`tk-${t.type}`}>
                {t.text}
              </span>
            ))}
          </code>
        </pre>
      ))}
    </div>
  );
}

/** Conteúdo da aba "manual". Sem chrome próprio: quem controla a exibição é o ToolPanel. */
export function ToolDoc({ doc }: { doc: ToolDocContent }) {
  return (
    <div className="tool-doc-body">
      <p>{prose(doc.intro)}</p>

      {doc.sections.map((s) => (
        <section key={s.h}>
          <h2>{s.h}</h2>
          {s.body.map((p) => (
            <p key={p}>{prose(p)}</p>
          ))}
          {s.demo && <MarkdownDemo src={s.demo} />}
          {s.img && (
            <figure className="tool-doc-fig">
              {/* eslint-disable-next-line @next/next/no-img-element -- webp já no tamanho final; o otimizador só recodificaria */}
              <img
                src={s.img.src}
                alt={s.img.alt}
                width={s.img.w}
                height={s.img.h}
                loading="lazy"
                decoding="async"
              />
              <figcaption>{s.img.caption}</figcaption>
            </figure>
          )}
          <CodeTabs group={`lang-${slug(s.h)}`} blocks={s.code} />
        </section>
      ))}

      <section>
        <h2>Perguntas frequentes</h2>
        {doc.faq.map((f) => (
          <div key={f.q}>
            <h3>{f.q}</h3>
            <p>{prose(f.a)}</p>
          </div>
        ))}
      </section>

      <section>
        <h2>Referências</h2>
        <ul className="tool-doc-refs">
          {doc.refs.map((r) => (
            <li key={r.href}>
              <a href={r.href} target="_blank" rel="noopener noreferrer">
                {r.label}
              </a>
              <span>{r.note}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
