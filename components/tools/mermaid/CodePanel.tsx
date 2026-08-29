"use client";

import { useRef, type RefObject } from "react";
import { Upload, X, PanelLeftClose } from "lucide-react";
import { CopyButton } from "@/components/ui/CopyButton";
import { CodeEditor } from "./CodeEditor";
import styles from "./mermaid.module.css";

interface Props {
  input: string;
  setInput: (v: string) => void;
  renderNow: () => void;
  resetFit: () => void;
  error: string;
  errLine: number | null;
  auto: boolean;
  setAuto: (fn: (a: boolean) => boolean) => void;
  onToggleCode: () => void;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  paneRef: RefObject<HTMLDivElement | null>;
  initialWidth: string;
}

export function CodePanel({
  input,
  setInput,
  renderNow,
  resetFit,
  error,
  errLine,
  auto,
  setAuto,
  onToggleCode,
  textareaRef,
  paneRef,
  initialWidth,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const lines = input.split("\n");

  const openFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      const r = new FileReader();
      r.onload = () => {
        resetFit();
        setInput(String(r.result));
        renderNow();
      };
      r.readAsText(f);
    }
    e.target.value = "";
  };

  const clearCode = () => {
    setInput("");
    renderNow();
  };

  const goToError = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.focus();
    if (!errLine) return;
    const upto = lines.slice(0, Math.max(0, errLine - 1)).join("\n").length;
    ta.selectionStart = upto;
    ta.selectionEnd = upto + (lines[errLine - 1] || "").length + 1;
    ta.scrollTop = Math.max(0, (errLine - 4) * 19.2);
  };

  return (
    <div ref={paneRef} className={styles.codePane} style={{ width: initialWidth }}>
      <div className={styles.paneHeader}>
        <span className="mono-label mono-label--wide" style={{ whiteSpace: "nowrap", flex: "0 0 auto" }}>
          {"// código"}
        </span>
        <span className={styles.paneMeta}>
          {lines.length} linhas · {input.length} car.
        </span>
        <div className={styles.headerSpacer} />
        <input
          ref={fileRef}
          type="file"
          accept=".mmd,.mermaid,.md,.txt,text/plain"
          onChange={openFile}
          style={{ display: "none" }}
        />
        <button type="button" title="abrir arquivo" className="mmd-icon-btn" onClick={() => fileRef.current?.click()}>
          <Upload size={14} />
        </button>
        <CopyButton text={input} />
        <button type="button" title="limpar" className="mmd-icon-btn" onClick={clearCode}>
          <X size={14} />
        </button>
        <button type="button" title="recolher painel (ctrl+b)" className="mmd-icon-btn" onClick={onToggleCode}>
          <PanelLeftClose size={14} />
        </button>
      </div>

      <CodeEditor input={input} setInput={setInput} textareaRef={textareaRef} />

      {error && (
        <button type="button" onClick={goToError} className={styles.errorBox}>
          <span className={styles.errorMark}>✗</span>
          <span style={{ minWidth: 0 }}>{error}</span>
        </button>
      )}

      <div className={styles.paneFooter}>
        <button
          type="button"
          title="renderizar automaticamente ao digitar"
          onClick={() => setAuto((a) => !a)}
          className={styles.autoToggle}
        >
          <span
            className={styles.autoTrack}
            style={{
              border: `1px solid ${auto ? "var(--color-primary)" : "var(--color-line)"}`,
              background: auto ? "var(--color-primary-tint)" : "transparent",
              justifyContent: auto ? "flex-end" : "flex-start",
            }}
          >
            <span
              className={styles.autoKnob}
              style={{ background: auto ? "var(--color-primary)" : "var(--color-muted)" }}
            />
          </span>
          <span className={styles.autoLabel}>auto</span>
        </button>
        <div className={styles.grow} />
        <button type="button" className="btn-primary" style={{ padding: "8px 18px" }} onClick={renderNow}>
          renderizar
        </button>
        <span className={styles.hint}>ctrl+enter</span>
      </div>
    </div>
  );
}
