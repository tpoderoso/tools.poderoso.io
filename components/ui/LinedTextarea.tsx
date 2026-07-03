"use client";

import { useLayoutEffect, useRef, type TextareaHTMLAttributes } from "react";

/**
 * `<textarea>` com números de linha no gutter esquerdo. Numera linhas lógicas
 * (`\n`): uma linha longa com soft-wrap segue contando como 1 — cada número
 * recebe a altura renderizada da sua linha, medida num mirror invisível.
 * O `className` (surface/textarea/etc.) vai no wrapper; font e cores herdam.
 */
export function LinedTextarea({ className = "", style, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const taRef = useRef<HTMLTextAreaElement>(null);
  const numsRef = useRef<HTMLDivElement>(null);
  const lines = String(rest.value ?? "").split("\n");

  useLayoutEffect(() => {
    const ta = taRef.current;
    const nums = numsRef.current;
    if (!ta || !nums) return;

    // ponytail: re-mede todas as linhas a cada tecla; virtualizar se textos de milhares de linhas pesarem
    const measure = () => {
      const cs = getComputedStyle(ta);
      const mirror = document.createElement("div");
      for (const p of ["font-family", "font-size", "font-weight", "letter-spacing", "line-height", "word-break", "tab-size"])
        mirror.style.setProperty(p, cs.getPropertyValue(p));
      Object.assign(mirror.style, {
        position: "absolute",
        visibility: "hidden",
        whiteSpace: "pre-wrap",
        overflowWrap: "break-word", // textareas quebram palavras longas por padrão
        width: `${ta.clientWidth}px`,
      });
      for (const line of String(ta.value).split("\n")) {
        const row = document.createElement("div");
        row.textContent = line || "\u200b"; // linha vazia ainda ocupa 1 altura
        mirror.appendChild(row);
      }
      document.body.appendChild(mirror);
      const rows = nums.children;
      Array.from(mirror.children).forEach((m, i) => {
        const row = rows[i] as HTMLElement | undefined;
        // getBoundingClientRect: altura fracionária — offsetHeight arredonda e o erro acumula em textos longos
        if (row) row.style.height = `${m.getBoundingClientRect().height}px`;
      });
      mirror.remove();
    };

    measure();
    const ro = new ResizeObserver(measure); // largura muda → wrap muda; cobre também o resize vertical
    ro.observe(ta);
    return () => ro.disconnect();
  });

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
          width: `${String(lines.length).length}ch`,
        }}
      >
        {/* absoluto: a altura dos números não pode esticar o wrapper — quem manda é o textarea */}
        <div ref={numsRef} style={{ position: "absolute", top: 0, left: 0, right: 0 }}>
          {lines.map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>
      </div>
      <textarea
        ref={taRef}
        {...rest}
        style={{
          flex: 1,
          minWidth: 0,
          padding: 0,
          border: "none",
          background: "transparent",
          color: "inherit",
          font: "inherit",
          resize: "none",
        }}
        onScroll={syncScroll}
      />
    </div>
  );
}
