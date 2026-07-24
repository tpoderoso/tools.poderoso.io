"use client";

import { useMemo, useRef, type RefObject } from "react";
import { tokenizeMermaid, type MermaidTokenType } from "@/lib/tools/highlight";
import styles from "./mermaid.module.css";

const TOKEN_COLORS: Partial<Record<MermaidTokenType, string>> = {
  keyword: "var(--color-accent-pink)",
  arrow: "var(--color-accent-cyan)",
  string: "var(--color-accent-yellow)",
  comment: "var(--color-muted)",
};

// ponytail: acima disso o overlay vira texto puro — dezenas de milhares de spans travam o DOM
const HIGHLIGHT_MAX_CHARS = 50_000;

interface Props {
  input: string;
  setInput: (v: string) => void;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
}

/**
 * Editor de código: gutter de linhas + overlay de syntax-highlight + textarea
 * transparente sobreposto. O scroll do textarea sincroniza gutter e overlay.
 */
export function CodeEditor({ input, setInput, textareaRef }: Props) {
  const gutterRef = useRef<HTMLPreElement>(null);
  const overlayRef = useRef<HTMLPreElement>(null);
  const lines = input.split("\n");

  const highlighted = useMemo(() => {
    if (input.length > HIGHLIGHT_MAX_CHARS) return input;
    return tokenizeMermaid(input).map((tok, i) =>
      tok.type === "plain" ? (
        tok.text
      ) : (
        <span key={i} style={{ color: TOKEN_COLORS[tok.type] }}>
          {tok.text}
        </span>
      ),
    );
  }, [input]);

  const syncScroll = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    if (gutterRef.current) gutterRef.current.scrollTop = ta.scrollTop;
    if (overlayRef.current) {
      overlayRef.current.scrollTop = ta.scrollTop;
      overlayRef.current.scrollLeft = ta.scrollLeft;
    }
  };

  const onCodeKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== "Tab") return;
    e.preventDefault();
    const ta = e.currentTarget;
    const s = ta.selectionStart;
    const en = ta.selectionEnd;
    setInput(input.slice(0, s) + "  " + input.slice(en));
    requestAnimationFrame(() => {
      ta.selectionStart = ta.selectionEnd = s + 2;
    });
  };

  return (
    <div className={styles.editorWrap}>
      <pre ref={gutterRef} aria-hidden className={styles.gutter}>
        {lines.map((_, i) => i + 1).join("\n")}
      </pre>
      <div className={styles.editorArea}>
        <pre ref={overlayRef} aria-hidden className={styles.overlay}>
          {highlighted}
          {"\n"}
        </pre>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onScroll={syncScroll}
          onKeyDown={onCodeKey}
          spellCheck={false}
          wrap="off"
          placeholder="cole o código Mermaid aqui — graph TD, erDiagram, sequenceDiagram, ..."
          className={styles.codeTextarea}
        />
      </div>
    </div>
  );
}
