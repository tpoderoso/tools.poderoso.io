"use client";

import { useRef, type CSSProperties, type RefObject } from "react";
import { CodeLines } from "@/components/ui/CodeLines";
import { tokenizeMermaid, type MermaidTokenType } from "@/lib/tools/highlight";
import styles from "./mermaid.module.css";

const TOKEN_COLORS: Partial<Record<MermaidTokenType, string>> = {
  keyword: "var(--color-accent-pink)",
  arrow: "var(--color-accent-cyan)",
  string: "var(--color-accent-yellow)",
  comment: "var(--color-muted)",
};

interface Props {
  input: string;
  setInput: (v: string) => void;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
}

/**
 * Editor de código: overlay de syntax-highlight (com os números de linha) + textarea
 * transparente sobreposto, ambos com soft-wrap. Os números vivem dentro do overlay
 * justamente por causa do wrap: como uma linha lógica pode ocupar N linhas visuais,
 * um gutter separado sairia do lugar na primeira linha longa.
 */
export function CodeEditor({ input, setInput, textareaRef }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const digits = String(input.split("\n").length).length;

  const syncScroll = () => {
    if (overlayRef.current && textareaRef.current)
      overlayRef.current.scrollTop = textareaRef.current.scrollTop;
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
      <div className={styles.editorArea} style={{ "--gutter": `calc(${digits}ch + 20px)` } as CSSProperties}>
        <div ref={overlayRef} aria-hidden className={styles.overlay}>
          <CodeLines text={input} tokenize={tokenizeMermaid} colors={TOKEN_COLORS} />
        </div>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onScroll={syncScroll}
          onKeyDown={onCodeKey}
          spellCheck={false}
          placeholder="cole o código Mermaid aqui: graph TD, erDiagram, sequenceDiagram, ..."
          className={styles.codeTextarea}
          style={{ paddingLeft: `calc(${digits}ch + 26px)` }}
        />
      </div>
    </div>
  );
}
