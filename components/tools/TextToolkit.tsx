"use client";

import { useRef, useState } from "react";
import { ToolPanel } from "@/components/ui/ToolPanel";
import { TextAreaField } from "@/components/ui/TextAreaField";
import { ToggleButton } from "@/components/ui/ToggleButton";
import { CopyButton } from "@/components/ui/CopyButton";
import { textStats, formatBytes, transforms } from "@/lib/tools/text";

const INITIAL = `Cole seu texto aqui.

Cada botão transforma o texto acima na hora, e as estatísticas atualizam sozinhas.`;

// grupos de ações: [rótulo do botão, chave da transformação, dica]
const GROUPS: { heading: string; actions: [string, keyof typeof transforms, string][] }[] = [
  {
    heading: "// caixa",
    actions: [
      ["MAIÚSCULAS", "upper", "tudo em maiúsculas"],
      ["minúsculas", "lower", "tudo em minúsculas"],
      ["Capitalizar", "title", "primeira letra de cada palavra"],
      ["Frase", "sentence", "primeira letra de cada frase"],
      ["iNVERTER cAIXA", "swapCase", "troca maiúsculas por minúsculas"],
    ],
  },
  {
    heading: "// limpeza",
    actions: [
      ["Remover espaços", "removeSpaces", "remove todos os espaços"],
      ["Remover tabs", "removeTabs", "remove as tabulações"],
      ["Colapsar espaços", "collapseSpaces", "vários espaços viram um só"],
      ["Trim linhas", "trimLines", "remove espaços nas pontas de cada linha"],
      ["Remover linhas vazias", "removeBlankLines", "remove linhas em branco"],
      ["Juntar linhas", "joinLines", "quebras de linha viram espaço"],
      ["Remover acentos", "removeAccents", "á vira a, ç vira c"],
    ],
  },
  {
    heading: "// linhas",
    actions: [
      ["Ordenar A-Z", "sortAsc", "ordena as linhas de A a Z"],
      ["Ordenar Z-A", "sortDesc", "ordena as linhas de Z a A"],
      ["Remover duplicadas", "dedupeLines", "remove linhas repetidas"],
      ["Inverter texto", "reverse", "inverte a ordem dos caracteres"],
      ["Slugify", "slugify", "vira-um-slug-de-url"],
    ],
  },
];

export function TextToolkit() {
  const [text, setText] = useState(INITIAL);
  const [prev, setPrev] = useState<string | null>(null);
  const [flashed, setFlashed] = useState<string | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ponytail: recompute por render; memo só se colarem MBs de texto
  const stats = textStats(text);

  const apply = (key: string, fn: (s: string) => string) => {
    setPrev(text);
    setText(fn(text));
    // pisca o botão clicado por um instante pra dar retorno visual
    setFlashed(key);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlashed(null), 350);
  };
  const undo = () => {
    if (prev === null) return;
    setText(prev);
    setPrev(null);
  };

  const chips: [string, string | number][] = [
    ["caracteres", stats.chars],
    ["sem espaços", stats.charsNoSpaces],
    ["palavras", stats.words],
    ["linhas", stats.lines],
    ["parágrafos", stats.paragraphs],
    ["tamanho", formatBytes(stats.bytes)],
    ["leitura", `${stats.readingMin} min`],
  ];

  return (
    <ToolPanel
      path="~/texto/ferramentas"
      description="transforma texto e mostra estatísticas ao vivo"
    >
      <TextAreaField
        label="// texto"
        value={text}
        onChange={setText}
        rows={10}
        labelRight={
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <ToggleButton
              active={false}
              onClick={undo}
              title="Voltar ao estado anterior à última transformação"
              style={{ opacity: prev === null ? 0.4 : 1, cursor: prev === null ? "default" : "pointer" }}
            >
              Desfazer
            </ToggleButton>
            <ToggleButton active={false} onClick={() => setText("")} title="Limpar o campo">
              Limpar
            </ToggleButton>
            <CopyButton text={text} variant="text" label="Copiar tudo" />
          </div>
        }
      />

      {/* estatísticas ao vivo */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          minHeight: 56, // reserva espaço p/ não haver layout shift
        }}
      >
        {chips.map(([label, value]) => (
          <div
            key={label}
            style={{
              flex: "1 1 90px",
              border: "1px solid var(--color-line)",
              borderRadius: 8,
              padding: "8px 12px",
              background: "var(--color-bg-alt)",
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 600, color: "var(--color-primary)" }}>
              {value}
            </div>
            <div style={{ fontSize: 10.5, color: "var(--color-muted)", marginTop: 2 }}>
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* botões de ação, agrupados */}
      {GROUPS.map((group) => (
        <div key={group.heading} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span className="mono-label">{group.heading}</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {group.actions.map(([label, key, hint]) => (
              <ToggleButton
                key={key}
                active={flashed === key}
                onClick={() => apply(key, transforms[key])}
                title={hint}
                style={{ transition: "background 0.15s, border-color 0.15s, color 0.15s" }}
              >
                {label}
              </ToggleButton>
            ))}
          </div>
        </div>
      ))}
    </ToolPanel>
  );
}
