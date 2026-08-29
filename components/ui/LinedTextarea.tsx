"use client";

import { useRef, type TextareaHTMLAttributes } from "react";

// ponytail: acima disso os números somem — um <div> por linha em colagem de MB trava a aba
const NUMBERS_MAX_LINES = 5_000;

/**
 * `<textarea>` com números de linha no gutter esquerdo e soft-wrap ligado: linha
 * longa quebra na largura da caixa em vez de rolar na horizontal.
 *
 * Com wrap, uma linha lógica pode ocupar N linhas visuais, então o gutter não pode
 * ser um bloco `"1\n2\n3"`. Em vez de medir cada linha no DOM (getBoundingClientRect
 * por linha travava a aba numa colagem de alguns MB), há um espelho invisível atrás
 * do textarea: mesmo font, mesma largura, mesmo padding, um `<div>` por linha. O
 * browser quebra o espelho igual ao textarea e cada número fica absoluto na sua
 * linha — alinhamento de graça, zero medição.
 */
export function LinedTextarea({ className = "", style, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const taRef = useRef<HTMLTextAreaElement>(null);
  const mirrorRef = useRef<HTMLDivElement>(null);
  const lines = String(rest.value ?? "").split("\n");
  const gutter = `calc(${String(lines.length).length}ch + 12px)`;

  const syncScroll = () => {
    if (mirrorRef.current && taRef.current)
      mirrorRef.current.style.transform = `translateY(-${taRef.current.scrollTop}px)`;
  };

  return (
    <div
      className={className}
      style={{ display: "flex", overflow: "hidden", resize: "vertical", fontFamily: "var(--font-mono)", ...style }}
    >
      <div style={{ position: "relative", flex: 1, minWidth: 0, overflow: "hidden" }}>
        <div
          ref={mirrorRef}
          aria-hidden
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            paddingLeft: gutter,
            whiteSpace: "pre-wrap",
            overflowWrap: "break-word",
            color: "transparent",
            userSelect: "none",
            pointerEvents: "none",
          }}
        >
          {lines.length <= NUMBERS_MAX_LINES &&
            lines.map((line, i) => (
              <div key={i} style={{ position: "relative" }}>
                <span style={{ position: "absolute", right: "calc(100% + 12px)", color: "var(--color-faint)" }}>
                  {i + 1}
                </span>
                {line || " "}
              </div>
            ))}
        </div>
        <textarea
          ref={taRef}
          {...rest}
          style={{
            display: "block",
            width: "100%",
            height: "100%",
            padding: 0,
            paddingLeft: gutter,
            border: "none",
            background: "transparent",
            color: "inherit",
            font: "inherit",
            resize: "none",
            whiteSpace: "pre-wrap",
            overflowWrap: "break-word",
            overflowX: "hidden",
          }}
          onScroll={syncScroll}
        />
      </div>
    </div>
  );
}
