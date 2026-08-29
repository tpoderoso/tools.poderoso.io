"use client";

import { useEffect, useState, type PointerEvent as ReactPointerEvent, type RefObject } from "react";
import { replaceNodeLabel } from "@/lib/tools/mermaidEdit";
import type { DiagramSize } from "@/lib/hooks/useMermaidRender";
import { DiagramToolbar } from "./DiagramToolbar";
import styles from "./mermaid.module.css";

interface Transform {
  x: number;
  y: number;
  scale: number;
}
interface PointerHandlers {
  onPointerDown: (e: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerMove: (e: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerUp: () => void;
  onPointerLeave: () => void;
}
interface Props {
  svg: string;
  size: DiagramSize;
  stale: boolean;
  t: Transform;
  grabbing: boolean;
  setInput: (fn: (code: string) => string) => void;
  viewportRef: RefObject<HTMLDivElement | null>;
  frameRef: RefObject<HTMLDivElement | null>;
  pointerHandlers: PointerHandlers;
  fit: () => void;
  zoom100: () => void;
  zoomBy: (f: number) => void;
  onToggleFullscreen: () => void;
}

interface Editing {
  id: string;
  value: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export function DiagramCanvas({
  svg,
  size,
  stale,
  t,
  grabbing,
  setInput,
  viewportRef,
  frameRef,
  pointerHandlers,
  fit,
  zoom100,
  zoomBy,
  onToggleFullscreen,
}: Props) {
  const [editing, setEditing] = useState<Editing | null>(null);

  // duplo-clique: num nó do flowchart edita o rótulo; fora dele, ajusta à tela.
  // listener nativo (não onDoubleClick do React) porque o alvo é svg injetado via innerHTML.
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const onDbl = (e: MouseEvent) => {
      const g = (e.target as Element).closest("g.node");
      if (!g) {
        fit();
        return;
      }
      const id = g.id.match(/flowchart-(.+)-\d+$/)?.[1];
      if (!id) return;
      const nr = g.getBoundingClientRect();
      const vr = vp.getBoundingClientRect();
      setEditing({
        id,
        value: (g.textContent || "").trim(),
        x: nr.left - vr.left,
        y: nr.top - vr.top,
        w: nr.width,
        h: nr.height,
      });
    };
    vp.addEventListener("dblclick", onDbl);
    return () => vp.removeEventListener("dblclick", onDbl);
  }, [fit, viewportRef]);

  const commitEdit = () => {
    if (editing) setInput((code) => replaceNodeLabel(code, editing.id, editing.value));
    setEditing(null);
  };

  const diagMeta = size.w
    ? `${size.w} × ${size.h} px${size.nodes ? ` · ${size.nodes} nós` : ""}`
    : "sem diagrama";

  return (
    <div ref={frameRef} className={styles.diagram}>
      <div
        ref={viewportRef}
        {...pointerHandlers}
        className={styles.viewport}
        style={{ cursor: grabbing ? "grabbing" : "grab" }}
      >
        {svg && (
          <div
            className={styles.svgHolder}
            style={{ transform: `translate(${t.x}px, ${t.y}px) scale(${t.scale})` }}
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        )}
      </div>

      {!svg && (
        <div className={styles.placeholder}>
          <span className={styles.placeholderText}>{"// o diagrama aparecerá aqui"}</span>
        </div>
      )}

      {stale && (
        <div className={styles.staleBadge}>
          <span>✗</span>
          <span>erro de sintaxe, exibindo a última versão válida</span>
        </div>
      )}

      <DiagramToolbar
        svg={svg}
        size={size}
        scale={t.scale}
        fit={fit}
        zoom100={zoom100}
        zoomBy={zoomBy}
        onToggleFullscreen={onToggleFullscreen}
      />

      <div className={styles.diagramFooter}>
        <span className="mono-label mono-label--wide" style={{ whiteSpace: "nowrap", flex: "0 0 auto" }}>
          {"// diagrama"}
        </span>
        <span className={styles.metaText}>{diagMeta}</span>
        <div style={{ flex: "1 1 0", minWidth: 8 }} />
        <span className={styles.metaText}>
          arraste para mover · scroll para zoom · duplo clique ajusta · ctrl+b código
        </span>
      </div>

      {editing && (
        <input
          autoFocus
          value={editing.value}
          onChange={(e) => setEditing({ ...editing, value: e.target.value })}
          onPointerDown={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitEdit();
            else if (e.key === "Escape") setEditing(null);
          }}
          onBlur={commitEdit}
          className={styles.editInput}
          style={{
            left: editing.x,
            top: editing.y,
            width: Math.max(editing.w, 70),
            height: Math.max(editing.h, 26),
          }}
        />
      )}
    </div>
  );
}
