"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FileText, Upload, X, PanelLeftClose, Lock, ClipboardPaste } from "lucide-react";
import { CopyButton } from "@/components/ui/CopyButton";
import { toastError } from "@/components/ui/Toaster";
import { parseMarkdown } from "@/lib/tools/markdown";
import { tokenizeMarkdown, type MarkdownTokenType } from "@/lib/tools/highlight";
import { MarkdownDoc } from "./MarkdownDoc";
import { ReadBar, SIZES, WIDTHS, type DocFont, type DocTheme } from "./ReadBar";
import styles from "./markdown.module.css";

const INITIAL_INPUT = `# API de Cobranças

Guia curto para integrar o serviço de cobranças. Todos os endpoints usam
\`https://api.exemplo.dev/v1\` como base e respondem em JSON.

> O ambiente de sandbox não gera cobrança de verdade. Use as chaves com
> prefixo \`sk_test_\` enquanto estiver desenvolvendo.

---

## Autenticação

Mande a chave no cabeçalho \`Authorization\` em toda requisição. Chaves têm
escopo por ambiente e podem ser revogadas no painel a qualquer momento.

\`\`\`bash
curl https://api.exemplo.dev/v1/charges \\
  -H "Authorization: Bearer sk_test_4eC39Hq" \\
  -H "Content-Type: application/json"
\`\`\`

## Criando uma cobrança

1. Monte o payload com o valor em **centavos**, nunca em reais.
2. Envie um \`POST /charges\` com a chave do ambiente certo.
3. Guarde o \`id\` devolvido para conciliar depois.

| campo | tipo | obrigatório |
| --- | --- | :--- |
| amount | integer | sim |
| currency | string | sim |
| customer | string | não |
| due_date | date | não |

## Webhooks

Cada evento chega uma vez, mas *pode* chegar fora de ordem. Trate o consumo
como idempotente.

- [x] assinar os eventos \`charge.paid\` e \`charge.failed\`
- [x] validar a assinatura do cabeçalho antes de processar
- [ ] configurar retry com espera exponencial

### Assinatura

O cabeçalho \`X-Signature\` traz um HMAC SHA-256 do corpo cru. Compare em tempo
constante e recuse qualquer divergência.

## Códigos de erro

| código | significado |
| --- | --- |
| 401 | chave ausente, inválida ou revogada |
| 422 | payload aceito mas com campo fora do formato |
| 429 | limite de requisições atingido, tente de novo depois |

Dúvidas ficam em [status.exemplo.dev](https://status.exemplo.dev) ou no canal
de suporte.
`;

const TOKEN_COLORS: Partial<Record<MarkdownTokenType, string>> = {
  heading: "var(--color-accent-pink)",
  marker: "var(--color-primary)",
  code: "var(--color-accent-cyan)",
  strong: "var(--color-accent-yellow)",
  link: "var(--color-secondary)",
  muted: "var(--color-muted)",
};

// ponytail: acima disso o painel de fonte vira texto puro — dezenas de milhares de spans travam o DOM
const HIGHLIGHT_MAX_CHARS = 50_000;
const MAX_FILE_BYTES = 2_000_000;

/** Título ativo é o último que já passou por esta distância do topo do painel. */
const ACTIVE_OFFSET = 90;

export function MarkdownViewer() {
  // abre vazio: primeiro a tela de colar, o documento só aparece depois que o texto entra
  const [input, setInput] = useState("");
  const [font, setFont] = useState<DocFont>("serif");
  const [size, setSize] = useState(1);
  const [width, setWidth] = useState(1);
  const [theme, setTheme] = useState<DocTheme>("dark");
  const [toc, setToc] = useState(true);
  const [srcOpen, setSrcOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [activeId, setActiveId] = useState("");

  const docRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const doc = useMemo(() => parseMarkdown(input), [input]);
  const empty = !input.trim();

  const highlighted = useMemo(() => {
    if (input.length > HIGHLIGHT_MAX_CHARS) return input;
    return tokenizeMarkdown(input).map((tok, i) =>
      tok.type === "plain" ? (
        tok.text
      ) : (
        <span key={i} style={{ color: TOKEN_COLORS[tok.type] }}>
          {tok.text}
        </span>
      ),
    );
  }, [input]);

  const load = useCallback((text: string) => {
    setInput(text);
    setActiveId("");
    if (docRef.current) docRef.current.scrollTop = 0;
  }, []);

  const readFile = useCallback(
    (file: File | undefined) => {
      if (!file) return;
      if (file.size > MAX_FILE_BYTES) {
        toastError("Arquivo muito grande. O limite é 2 MB.");
        return;
      }
      file
        .text()
        .then(load)
        .catch(() => toastError("Não deu para ler o arquivo"));
    },
    [load],
  );

  // colar em qualquer lugar da tela troca o documento — é assim que o texto entra aqui
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el?.tagName === "INPUT" || el?.tagName === "TEXTAREA" || el?.isContentEditable) return;
      const text = e.clipboardData?.getData("text/plain");
      if (!text) return;
      e.preventDefault();
      load(text);
    };
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, [load]);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen();
    else frameRef.current?.requestFullscreen().catch(() => {});
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "b" || e.key === "B")) {
        e.preventDefault();
        setSrcOpen((o) => !o);
        return;
      }
      const tag = (e.target as HTMLElement)?.tagName || "";
      if (tag === "INPUT" || tag === "TEXTAREA" || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        toggleFullscreen();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleFullscreen]);

  const onScroll = () => {
    const pane = docRef.current;
    if (!pane) return;
    const top = pane.getBoundingClientRect().top;
    // no fim do scroll os últimos títulos nunca chegam ao topo: vale o último visível
    const atBottom = pane.scrollHeight - pane.scrollTop - pane.clientHeight < 4;
    const limit = atBottom ? pane.clientHeight : ACTIVE_OFFSET;
    let id = "";
    for (const h of pane.querySelectorAll<HTMLElement>("[data-mdh]")) {
      if (h.getBoundingClientRect().top - top > limit) break;
      id = h.dataset.mdh ?? "";
    }
    setActiveId(id);
  };

  const goTo = (id: string) => {
    docRef.current?.querySelector<HTMLElement>(`[data-mdh="${CSS.escape(id)}"]`)?.scrollIntoView({ block: "start" });
    setActiveId(id);
  };

  const pasteFromClipboard = () => {
    navigator.clipboard
      ?.readText()
      .then((text) => (text.trim() ? load(text) : toastError("A área de transferência está vazia")))
      .catch(() => toastError("O navegador bloqueou a leitura da área de transferência"));
  };

  const lines = input.split("\n").length;

  return (
    <div
      ref={frameRef}
      className={styles.viewer}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        readFile(e.dataTransfer.files[0]);
      }}
    >
      <input
        ref={fileRef}
        type="file"
        accept=".md,.markdown,.mdown,.txt,text/markdown,text/plain"
        onChange={(e) => {
          readFile(e.target.files?.[0]);
          e.target.value = "";
        }}
        style={{ display: "none" }}
      />

      <div className={styles.header}>
        <span className={styles.headerTitle}>~/view/markdown</span>
        <span className={styles.headerDash}>—</span>
        <span className={styles.headerDesc}>renderiza markdown colado, com controles de leitura</span>
        <div className={styles.grow} />
        <div className={styles.pill}>
          <span
            className={styles.pillDot}
            style={
              empty
                ? { background: "var(--color-muted)" }
                : { background: "var(--color-primary)", boxShadow: "0 0 8px var(--color-primary)" }
            }
          />
          <span className={styles.pillText} style={{ color: empty ? "var(--color-muted)" : "var(--color-primary)" }}>
            {empty ? "aguardando" : "renderizado"}
          </span>
        </div>
      </div>

      <ReadBar
        font={font}
        setFont={setFont}
        size={size}
        setSize={setSize}
        width={width}
        setWidth={setWidth}
        theme={theme}
        setTheme={setTheme}
        toc={toc}
        toggleToc={() => setToc((t) => !t)}
        onToggleFullscreen={toggleFullscreen}
        dim={empty}
      />

      {empty ? (
        <div className={styles.empty}>
          <div className={styles.emptyCol}>
            <div className={`${styles.drop} ${dragging ? styles.dropOver : ""}`}>
              <FileText size={34} strokeWidth={1.4} color="var(--color-line)" />
              <span className={styles.dropTitle}>cole o markdown aqui</span>
              <div className={styles.keys}>
                <span className={styles.key}>Ctrl</span>
                <span style={{ color: "var(--color-line)" }}>+</span>
                <span className={styles.key}>V</span>
              </div>
              <span className={styles.dropSub}>ou arraste um arquivo para esta área</span>
              <div className={styles.exts}>
                <span className={styles.ext}>.md</span>
                <span className={styles.ext}>.markdown</span>
                <span className={styles.ext}>.txt</span>
              </div>
            </div>

            <div className={styles.emptyActions}>
              <button type="button" className="btn-primary" onClick={() => fileRef.current?.click()}>
                abrir arquivo
              </button>
              <button type="button" className="btn-copy-text" onClick={pasteFromClipboard}>
                <ClipboardPaste size={13} strokeWidth={2} />
                colar da área de transferência
              </button>
              <button type="button" className="btn-copy-text" onClick={() => load(INITIAL_INPUT)}>
                ver o exemplo
              </button>
            </div>

            <p className="gen-footnote" style={{ maxWidth: "44ch" }}>
              tudo roda no seu navegador. o texto colado não sai da máquina e nada fica salvo depois que você fecha a
              aba.
            </p>
          </div>
        </div>
      ) : (
        <div className={styles.body}>
          {srcOpen ? (
            <div className={styles.srcPane}>
              <div className={styles.srcHead}>
                <span className="mono-label mono-label--wide" style={{ whiteSpace: "nowrap", flex: "0 0 auto" }}>
                  {"// fonte"}
                </span>
                <span className={styles.srcMeta}>
                  {lines} linhas · {input.length} car.
                </span>
                <div className={styles.grow} />
                <button
                  type="button"
                  title="abrir arquivo"
                  className="mmd-icon-btn"
                  onClick={() => fileRef.current?.click()}
                >
                  <Upload size={14} />
                </button>
                <CopyButton text={input} variant="icon" />
                <button type="button" title="limpar" className="mmd-icon-btn" onClick={() => load("")}>
                  <X size={14} />
                </button>
                <button
                  type="button"
                  title="recolher painel — ctrl+b"
                  className="mmd-icon-btn"
                  onClick={() => setSrcOpen(false)}
                >
                  <PanelLeftClose size={14} />
                </button>
              </div>

              <div className={styles.srcBody}>
                <pre aria-hidden className={styles.gutter}>
                  {Array.from({ length: lines }, (_, i) => i + 1).join("\n")}
                </pre>
                <pre className={styles.srcCode}>{highlighted}</pre>
              </div>

              <div className={styles.srcFoot}>
                <span className={styles.readOnly}>
                  <Lock size={13} strokeWidth={2} />
                  somente leitura
                </span>
                <div className={styles.grow} />
                <span>para trocar o texto, cole de novo</span>
              </div>
            </div>
          ) : (
            <button
              type="button"
              title="mostrar o markdown de origem — ctrl+b"
              className={styles.rail}
              onClick={() => setSrcOpen(true)}
            >
              <span className={styles.railLabel}>FONTE ›</span>
            </button>
          )}

          {toc && (
            <aside className={styles.toc}>
              <div className={styles.tocHead}>
                <span className="mono-label">sumário</span>
              </div>
              <div className={styles.tocList}>
                {doc.headings.length === 0 && (
                  <span className="text-muted-sm" style={{ padding: "8px 10px" }}>
                    o documento não tem títulos
                  </span>
                )}
                {doc.headings.map((h) => (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => goTo(h.id)}
                    className={`${styles.tocItem} ${activeId === h.id ? styles.tocItemOn : ""}`}
                    style={{ paddingLeft: 10 + (h.level - 1) * 12 }}
                  >
                    <span className={styles.tocMark}>{"#".repeat(h.level)}</span>
                    <span>{h.text}</span>
                  </button>
                ))}
              </div>
              <div className={styles.tocFoot}>
                {doc.headings.length} {doc.headings.length === 1 ? "título" : "títulos"}
                <br />
                nada sai da sua máquina
              </div>
            </aside>
          )}

          <div className={styles.docWrap}>
            <div
              ref={docRef}
              onScroll={onScroll}
              className={`${styles.doc} ${styles[theme]} ${font === "serif" ? styles.serif : ""}`}
              style={{ fontSize: SIZES[size] }}
            >
              <div
                className={styles.docInner}
                style={{
                  maxWidth: `${WIDTHS[width]}ch`,
                  fontFamily: font === "serif" ? "var(--font-serif)" : "var(--font-mono)",
                  // mono desenha maior que a serifada no mesmo corpo
                  fontSize: font === "mono" ? "0.88em" : undefined,
                }}
              >
                <MarkdownDoc blocks={doc.blocks} />
              </div>
            </div>

            <div className={styles.docFoot}>
              <span>{doc.words.toLocaleString("pt-BR")} palavras</span>
              <span className={styles.dotSep}>·</span>
              <span>~{doc.minutes} min de leitura</span>
              <span className={styles.dotSep}>·</span>
              <span>{lines} linhas</span>
              <div className={styles.grow} />
              <span>{dragging ? "solte o arquivo para abrir" : "cole (ctrl+v) para trocar o documento"}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
