import { memo, type ReactNode } from "react";

// ponytail: acima disso vira texto puro — dezenas de milhares de spans travam o DOM
export const HIGHLIGHT_MAX_CHARS = 200_000;

interface Token {
  text: string;
  type: string;
}

interface CodeLinesProps {
  text: string;
  tokenize: (s: string) => Token[];
  /** tipo do token -> cor. Tipo ausente do mapa sai sem span, como texto puro. */
  colors: Record<string, string | undefined>;
}

/**
 * Saída tokenizada com números de linha no gutter, uma linha por `\n` do texto.
 * Usada pelo XML e pelo JSON — `memo` porque tokenizar a cada tecla digitada na
 * entrada seria refazer o mesmo trabalho com a mesma saída.
 */
export const CodeLines = memo(function CodeLines({ text, tokenize, colors }: CodeLinesProps): ReactNode {
  if (text.length > HIGHLIGHT_MAX_CHARS) return text;

  const lines: ReactNode[][] = [[]];
  for (const t of tokenize(text)) {
    t.text.split("\n").forEach((part, i) => {
      if (i > 0) lines.push([]);
      if (!part) return;
      const cur = lines[lines.length - 1];
      cur.push(
        colors[t.type] ? (
          <span key={cur.length} style={{ color: colors[t.type] }}>
            {part}
          </span>
        ) : (
          part
        )
      );
    });
  }

  const gutterWidth = `${String(lines.length).length}ch`;
  return lines.map((line, i) => (
    <div key={i} style={{ display: "flex", gap: 12 }}>
      <span
        style={{
          width: gutterWidth,
          flexShrink: 0,
          textAlign: "right",
          color: "var(--color-faint)",
          userSelect: "none",
        }}
      >
        {i + 1}
      </span>
      <span style={{ flex: 1 }}>{line}</span>
    </div>
  ));
});
