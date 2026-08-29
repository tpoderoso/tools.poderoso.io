"use client";

import { useDeferredValue, useMemo, useRef, useState } from "react";
import { Wand2, UnfoldVertical, FoldVertical } from "lucide-react";
import { ToolPanel } from "@/components/ui/ToolPanel";
import { SplitPane } from "@/components/ui/SplitPane";
import { TextAreaField } from "@/components/ui/TextAreaField";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { ToggleButton } from "@/components/ui/ToggleButton";
import { CopyButton } from "@/components/ui/CopyButton";
import { CodeLines } from "@/components/ui/CodeLines";
import { toastError } from "@/components/ui/Toaster";
import { validateJson } from "@/lib/tools/jsonValidate";
import { tokenizeJSON, type JsonTokenType } from "@/lib/tools/highlight";
import {
  JsonTree,
  countNodes,
  structureText,
  LARGE_TREE_NODES,
  type JsonValue,
  type ViewMode,
} from "./JsonTree";

const INITIAL_INPUT = `{
  "nome": "Thiago Poderoso",
  "role": "Tech Lead",
  "ativo": true,
  "filhos": null,
  "stack": ["C#", "Node.js", ".NET"],
  "endereco": {
    "cidade": "São Paulo",
    "pais": "Brasil"
  }
}`;

const TOKEN_COLORS: Partial<Record<JsonTokenType, string>> = {
  key: "var(--color-accent-cyan)",
  string: "var(--color-accent-yellow)",
  number: "var(--color-secondary)",
  boolean: "var(--color-primary)",
  null: "var(--color-danger)",
};

/** As três situações da barra de status, com as cores de cada uma. */
const STATUS = {
  vazio: { bg: "transparent", border: "var(--color-border)", fg: "var(--color-muted)" },
  ok: { bg: "var(--color-primary-tint)", border: "var(--color-primary-tint-border)", fg: "var(--color-primary)" },
  erro: { bg: "var(--color-danger-tint)", border: "var(--color-danger-tint-border)", fg: "var(--color-danger)" },
} as const;

type Tab = "formatado" | "arvore";

function countKeys(value: JsonValue): number {
  if (value === null || typeof value !== "object") return 0;
  const children = Array.isArray(value) ? value : Object.values(value);
  const own = Array.isArray(value) ? 0 : Object.keys(value).length;
  return children.reduce<number>((n, child) => n + countKeys(child), own);
}

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1).replace(".", ",")} kB`;
  return `${(bytes / 1024 / 1024).toFixed(1).replace(".", ",")} MB`;
}

/**
 * Formatador, validador e visualizador de JSON no mesmo painel: uma entrada, duas
 * visões da saída (texto formatado e árvore) e a validação sempre à vista embaixo
 * do editor, valendo para as duas.
 *
 * Não tem botão "Formatar": a saída acompanha a digitação, com `useDeferredValue`
 * segurando o parse em prioridade baixa para colagem grande não travar a tecla.
 */
export function JsonTool() {
  const [input, setInput] = useState(INITIAL_INPUT);
  const [tab, setTab] = useState<Tab>("formatado");
  const [mode, setMode] = useState<ViewMode>("valores");
  const [expandAll, setExpandAll] = useState(true);
  const [treeVersion, setTreeVersion] = useState(0);

  const deferred = useDeferredValue(input);
  const empty = deferred.trim() === "";

  const { check, parsed, bytes } = useMemo(() => {
    const check = validateJson(deferred);
    return {
      check,
      // objeto em volta porque `null` é um JSON válido e não pode se confundir com "não deu"
      parsed: check.ok ? { value: JSON.parse(deferred) as JsonValue } : null,
      bytes: new TextEncoder().encode(deferred).length,
    };
  }, [deferred]);

  // a saída segura o último JSON válido: enquanto você digita e o texto quebra no
  // meio, o painel da direita continua mostrando o resultado anterior, apagado, em
  // vez de piscar vazio a cada tecla
  const lastGood = useRef<JsonValue>(JSON.parse(INITIAL_INPUT));
  if (parsed) lastGood.current = parsed.value;
  const value = lastGood.current;

  const formatted = useMemo(() => JSON.stringify(value, null, 2), [value]);
  const tooLargeToExpand = useMemo(
    () => countNodes(value, LARGE_TREE_NODES) >= LARGE_TREE_NODES,
    [value],
  );

  const status = empty ? "vazio" : check.ok ? "ok" : "erro";
  const isTree = tab === "arvore";
  const copyText = isTree && mode === "estrutura" ? structureText(value) : formatted;

  const setAllExpanded = (next: boolean) => {
    if (next && tooLargeToExpand) {
      toastError("Árvore grande demais para expandir tudo de uma vez. Abra os nós manualmente.");
      return;
    }
    setExpandAll(next);
    setTreeVersion((v) => v + 1);
  };

  return (
    <ToolPanel path="~/format/json" description="formata, valida e navega JSON em árvore">
      <SplitPane>
        <div className="field-col">
          <TextAreaField
            label="// entrada"
            value={input}
            onChange={setInput}
            focusColor={status === "erro" ? "danger" : "primary"}
          />

          {/* a validação não é uma terceira aba: é o estado da entrada, e vale para as duas visões */}
          <div
            aria-live="polite"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
              rowGap: 8,
              minHeight: 36,
              padding: "8px 12px",
              borderRadius: 8,
              fontSize: 11.5,
              background: STATUS[status].bg,
              border: `1px solid ${STATUS[status].border}`,
              color: STATUS[status].fg,
            }}
          >
            {status === "vazio" && <span>cole um JSON para começar</span>}

            {status === "ok" && (
              <>
                <span>✓ JSON válido</span>
                <span style={{ color: "var(--color-line)" }}>·</span>
                <span style={{ color: "var(--color-muted-soft)" }}>
                  {countKeys(value) === 1 ? "1 chave" : `${countKeys(value)} chaves`} · {fmtSize(bytes)}
                </span>
              </>
            )}

            {!check.ok && status === "erro" && (
              <>
                <span style={{ flexShrink: 0 }}>
                  ✗ linha {check.line}, coluna {check.column}
                </span>
                <span style={{ color: "var(--color-line)" }}>·</span>
                <span style={{ color: "var(--color-muted-soft)" }}>{check.message}</span>
                {check.fixed ? (
                  <PrimaryButton
                    onClick={() => setInput(check.fixed!)}
                    style={{ marginLeft: "auto", padding: "5px 12px", fontSize: 11 }}
                  >
                    <Wand2 size={12} style={{ verticalAlign: -2, marginRight: 6 }} />
                    Corrigir
                  </PrimaryButton>
                ) : (
                  <span className="mono-label" style={{ marginLeft: "auto" }}>
                    sem correção automática
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        <div className="field-col">
          <div className="label-row--between" style={{ flexWrap: "wrap", rowGap: 8 }}>
            <div className="mmd-btn-group">
              {(["formatado", "arvore"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  className="mmd-tool-btn"
                  onClick={() => setTab(t)}
                  style={{
                    padding: "0 14px",
                    fontSize: 12,
                    ...(tab === t
                      ? { background: "var(--color-primary-tint)", color: "var(--color-primary)" }
                      : null),
                  }}
                >
                  {t === "formatado" ? "formatado" : "árvore"}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              {isTree && (
                <>
                  <ToggleButton active={mode === "valores"} onClick={() => setMode("valores")}>
                    Valores
                  </ToggleButton>
                  <ToggleButton active={mode === "estrutura"} onClick={() => setMode("estrutura")}>
                    Estrutura
                  </ToggleButton>
                  <ToggleButton active={expandAll} onClick={() => setAllExpanded(true)} title="Expandir tudo">
                    <UnfoldVertical size={14} style={{ verticalAlign: -2 }} />
                  </ToggleButton>
                  <ToggleButton active={!expandAll} onClick={() => setAllExpanded(false)} title="Recolher tudo">
                    <FoldVertical size={14} style={{ verticalAlign: -2 }} />
                  </ToggleButton>
                </>
              )}
              <CopyButton text={copyText} />
            </div>
          </div>

          {/* uma caixa só para as duas visões: trocar de aba não mexe no layout */}
          <div
            className="surface"
            style={{
              flex: 1,
              padding: 14,
              fontSize: 12,
              lineHeight: isTree ? 1.7 : 1.65,
              overflow: "auto",
              minHeight: 380,
              // conteúdo grande não pode inflar o painel — dimensiona como se vazio e rola por dentro
              contain: "size",
              // enquanto a entrada está quebrada a saída é o último resultado válido, e diz isso
              opacity: status === "ok" ? 1 : 0.45,
            }}
          >
            {empty ? (
              <span style={{ color: "var(--color-muted)" }}>{"// o JSON aparecerá aqui"}</span>
            ) : isTree ? (
              <JsonTree key={treeVersion} value={value} mode={mode} expandAll={expandAll && !tooLargeToExpand} />
            ) : (
              // a indentação do JSON é espaço no começo da linha: sem `pre-wrap` ela some
              <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                <CodeLines text={formatted} tokenize={tokenizeJSON} colors={TOKEN_COLORS} />
              </div>
            )}
          </div>
        </div>
      </SplitPane>
    </ToolPanel>
  );
}
