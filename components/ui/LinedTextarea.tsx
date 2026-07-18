"use client";

import { useRef, type TextareaHTMLAttributes } from "react";

/**
 * `<textarea>` com números de linha no gutter esquerdo. Sem soft-wrap (`wrap="off"`):
 * cada linha lógica ocupa exatamente 1 linha visual, então o gutter é só um bloco de
 * texto (`"1\n2\n3..."`) alinhado por line-height via CSS — nada de medir DOM por
 * linha. Antes disso, um espelho invisível media a altura de cada linha via
 * getBoundingClientRect a cada tecla; numa colagem de alguns MB isso travava a aba.
 */
export function LinedTextarea({ className = "", style, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const taRef = useRef<HTMLTextAreaElement>(null);
  const numsRef = useRef<HTMLDivElement>(null);
  const lineCount = (String(rest.value ?? "").match(/\n/g)?.length ?? 0) + 1;
  const numbers = Array.from({ length: lineCount }, (_, i) => i + 1).join("\n");

  const syncScroll = () => {
    if (numsRef.current && taRef.current)
      numsRef.current.style.transform = `translateY(-${taRef.current.scrollTop}px)`;
  };

  return (
    <div
      className={className}
      style={{ display: "flex", overflow: "hidden", resize: "vertical", fontFamily: "var(--font-mono)", ...style }}
    >
      <div
        style={{
          flex: "none",
          position: "relative",
          marginRight: 12,
          overflow: "hidden",
          textAlign: "right",
          color: "var(--color-line)",
          userSelect: "none",
          width: `${String(lineCount).length}ch`,
        }}
      >
        <div ref={numsRef} style={{ position: "absolute", top: 0, left: 0, right: 0, whiteSpace: "pre" }}>
          {numbers}
        </div>
      </div>
      <textarea
        ref={taRef}
        {...rest}
        wrap="off"
        style={{
          flex: 1,
          minWidth: 0,
          padding: 0,
          border: "none",
          background: "transparent",
          color: "inherit",
          font: "inherit",
          resize: "none",
          whiteSpace: "pre",
          overflowX: "auto",
        }}
        onScroll={syncScroll}
      />
    </div>
  );
}
