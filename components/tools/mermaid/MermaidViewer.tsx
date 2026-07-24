"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { ToggleButton } from "@/components/ui/ToggleButton";
import { INITIAL_INPUT, THEMES, type ThemeName } from "@/lib/tools/mermaid";
import { useMermaidRender, type Status } from "@/lib/hooks/useMermaidRender";
import { usePanZoom } from "@/lib/hooks/usePanZoom";
import { CodePanel } from "./CodePanel";
import { DiagramCanvas } from "./DiagramCanvas";
import styles from "./mermaid.module.css";

const INITIAL_PANE = "25%";

export function MermaidViewer() {
  const [input, setInput] = useState(INITIAL_INPUT);
  const [theme, setTheme] = useState<ThemeName>("dracula");
  const [auto, setAuto] = useState(true);
  const [codeOpen, setCodeOpen] = useState(true);

  const { svg, size, status, error, errLine, stale, renderNow } = useMermaidRender(input, theme, auto);
  const { t, grabbing, viewportRef, fit, zoom100, zoomBy, resetFit, pointerHandlers } = usePanZoom(size, svg);

  const paneRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const toggleCode = useCallback(() => {
    setCodeOpen((o) => !o);
    setTimeout(() => fit(), 40); // reajusta à tela quando o painel abre/fecha
  }, [fit]);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen();
    else frameRef.current?.requestFullscreen().catch(() => {});
    setTimeout(() => fit(), 220);
  }, [fit]);

  // atalhos globais — actionsRef pra não re-registrar o listener a cada render
  const actions = { fit, zoom100, zoomBy, toggleCode, toggleFullscreen, render: renderNow };
  const actionsRef = useRef(actions);
  useEffect(() => {
    actionsRef.current = actions;
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const a = actionsRef.current;
      const tag = (e.target as HTMLElement)?.tagName || "";
      const typing = tag === "TEXTAREA" || tag === "INPUT";
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        a.render();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === "b" || e.key === "B")) {
        e.preventDefault();
        a.toggleCode();
        return;
      }
      if (typing || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === "0") {
        e.preventDefault();
        a.fit();
      } else if (e.key === "1") {
        e.preventDefault();
        a.zoom100();
      } else if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        a.zoomBy(1.2);
      } else if (e.key === "-" || e.key === "_") {
        e.preventDefault();
        a.zoomBy(1 / 1.2);
      } else if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        a.toggleFullscreen();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // divisor arrastável: mexe na largura do painel imperativamente (sem re-render por frame)
  const onSplitDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    const pane = paneRef.current;
    const main = pane?.parentElement;
    if (!pane || !main) return;
    e.preventDefault();
    const rect = main.getBoundingClientRect();
    const move = (ev: PointerEvent) => {
      const pct = Math.max(18, Math.min(72, ((ev.clientX - rect.left) / rect.width) * 100));
      pane.style.width = pct + "%";
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      fit();
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };
  const resetSplit = () => {
    if (paneRef.current) paneRef.current.style.width = INITIAL_PANE;
    setTimeout(() => fit(), 30);
  };

  const statusInfo: Record<Status, { color: string; text: string }> = {
    idle: { color: "var(--color-muted)", text: "aguardando" },
    rendering: { color: "var(--color-accent-yellow)", text: "renderizando" },
    ok: { color: "var(--color-primary)", text: "renderizado" },
    error: { color: "var(--color-danger)", text: errLine ? `erro na linha ${errLine}` : "erro de sintaxe" },
  };
  const st = statusInfo[status];

  return (
    <div className={styles.viewer}>
      <div className={styles.header}>
        <span className={styles.headerTitle}>~/diagram/mermaid</span>
        <span className={styles.headerDash}>—</span>
        <span className={styles.headerDesc}>visualiza e navega diagramas Mermaid com zoom e arraste</span>
        <div className={styles.grow} />
        <div className={styles.statusPill}>
          <span className={styles.statusDot} style={{ background: st.color, boxShadow: `0 0 8px ${st.color}` }} />
          <span className={styles.statusText} style={{ color: st.color }}>
            {st.text}
          </span>
        </div>
        <div className={styles.themeRow}>
          {THEMES.map((name) => (
            <ToggleButton key={name} active={theme === name} onClick={() => setTheme(name)}>
              {name}
            </ToggleButton>
          ))}
        </div>
      </div>

      <div className={styles.body}>
        {codeOpen ? (
          <>
            <CodePanel
              input={input}
              setInput={setInput}
              renderNow={renderNow}
              resetFit={resetFit}
              error={error}
              errLine={errLine}
              auto={auto}
              setAuto={setAuto}
              onToggleCode={toggleCode}
              textareaRef={textareaRef}
              paneRef={paneRef}
              initialWidth={INITIAL_PANE}
            />
            <div
              onPointerDown={onSplitDown}
              onDoubleClick={resetSplit}
              title="arraste para redimensionar"
              className={styles.splitter}
            />
          </>
        ) : (
          <button type="button" title="mostrar código — ctrl+b" onClick={toggleCode} className={styles.collapsedBtn}>
            <span className={styles.collapsedLabel}>CÓDIGO ›</span>
          </button>
        )}

        <DiagramCanvas
          svg={svg}
          size={size}
          stale={stale}
          t={t}
          grabbing={grabbing}
          setInput={setInput}
          viewportRef={viewportRef}
          frameRef={frameRef}
          pointerHandlers={pointerHandlers}
          fit={fit}
          zoom100={zoom100}
          zoomBy={zoomBy}
          onToggleFullscreen={toggleFullscreen}
        />
      </div>
    </div>
  );
}
