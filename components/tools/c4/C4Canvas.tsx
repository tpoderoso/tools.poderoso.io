"use client";

import { useRef, type PointerEvent as ReactPointerEvent, type RefObject } from "react";
import { byId, childrenOf, type C4Model } from "@/lib/tools/c4/model";
import type { C4View } from "@/lib/tools/c4/views";
import { edgeLine, type Box, type LayoutResult } from "@/lib/tools/c4/layout";
import { usePanZoom } from "@/lib/hooks/usePanZoom";
import { ElementShape } from "./ElementShape";
import { truncate } from "@/lib/tools/c4/text";
import { C4Toolbar } from "./C4Toolbar";
import styles from "./c4.module.css";

/** Largura média do IBM Plex Mono em px por caractere, na escala do desenho. */
const CHAR_W = 6.4;

interface Props {
  view: C4View;
  model: C4Model;
  layout: LayoutResult;
  onOpen?: (id: string) => void;
  onMove?: (id: string, pos: { x: number; y: number }) => void;
  selected: string | null;
  onSelect: (id: string | null) => void;
  svgRef?: RefObject<SVGSVGElement | null>;
  frameRef?: RefObject<HTMLDivElement | null>;
  onToggleFullscreen: () => void;
  onAutoLayout: () => void;
  canAutoLayout: boolean;
}

export function C4Canvas({
  view,
  model,
  layout,
  onOpen,
  onMove,
  selected,
  onSelect,
  svgRef,
  frameRef,
  onToggleFullscreen,
  onAutoLayout,
  canAutoLayout,
}: Props) {
  // a chave de refit muda quando entra ou sai um nó, e ao trocar de view; não
  // muda ao arrastar, senão a tela pularia no meio do arrasto
  const { t, grabbing, viewportRef, fit, zoom100, zoomBy, pointerHandlers } = usePanZoom(
    { w: layout.width, h: layout.height },
    `${view.id}:${view.nodes.length}`,
  );

  const boxOf = new Map(layout.boxes.map((b) => [b.id, b]));
  const empty = view.nodes.length === 0;

  // arrasto de caixa. O delta vem em pixels de tela e precisa ser dividido pela
  // escala do zoom para virar unidade do desenho, senão a caixa "foge" do cursor
  // quando o zoom não está em 100%.
  const dragRef = useRef<{ id: string; px: number; py: number; ox: number; oy: number } | null>(null);

  const startDrag = (e: ReactPointerEvent<SVGGElement>, box: Box) => {
    e.stopPropagation(); // não deixa o usePanZoom entender isso como pan
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    dragRef.current = { id: box.id, px: e.clientX, py: e.clientY, ox: box.x, oy: box.y };
  };

  const moveDrag = (e: ReactPointerEvent<SVGGElement>) => {
    const d = dragRef.current;
    if (!d || !onMove) return;
    e.stopPropagation();
    onMove(d.id, {
      x: Math.round(d.ox + (e.clientX - d.px) / t.scale),
      y: Math.round(d.oy + (e.clientY - d.py) / t.scale),
    });
  };

  const endDrag = () => {
    dragRef.current = null;
  };

  // distingue "clique parado no fundo" de "clique residual ao soltar um pan":
  // usePanZoom já captura o ponteiro e arrasta a partir de 3px, mas não suprime
  // o click nativo que o navegador dispara ao soltar no mesmo elemento — sem
  // isso, arrastar o fundo pra olhar outra parte do diagrama apaga a seleção.
  const panStart = useRef<{ x: number; y: number } | null>(null);
  const panMoved = useRef(false);

  const onViewportPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    panStart.current = { x: e.clientX, y: e.clientY };
    panMoved.current = false;
    pointerHandlers.onPointerDown(e);
  };

  const onViewportPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (panStart.current) {
      const dx = e.clientX - panStart.current.x;
      const dy = e.clientY - panStart.current.y;
      if (Math.abs(dx) + Math.abs(dy) >= 3) panMoved.current = true;
    }
    pointerHandlers.onPointerMove(e);
  };

  const onViewportClick = () => {
    if (panMoved.current) {
      panMoved.current = false;
      return;
    }
    onSelect(null);
  };

  return (
    <div className={styles.canvas} ref={frameRef}>
      <div
        ref={viewportRef}
        {...pointerHandlers}
        onPointerDown={onViewportPointerDown}
        onPointerMove={onViewportPointerMove}
        onClick={onViewportClick}
        className={styles.viewport}
        style={{ cursor: grabbing ? "grabbing" : "grab" }}
      >
        <svg
          ref={svgRef}
          width={layout.width}
          height={layout.height}
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          style={{
            transform: `translate(${t.x}px, ${t.y}px) scale(${t.scale})`,
            transformOrigin: "0 0",
            fontFamily: "var(--font-mono)",
          }}
        >
          <defs>
            <marker id="c4-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" style={{ fill: "var(--color-line)" }} />
            </marker>
          </defs>

          {layout.boundaries.map((b) => (
            <g key={b.id}>
              <rect
                x={b.x}
                y={b.y}
                width={b.w}
                height={b.h}
                rx={8}
                strokeDasharray="6 5"
                style={{ fill: "none", stroke: "var(--color-line)" }}
              />
              <text x={b.x + 12} y={b.y + 19} fontSize={11} style={{ fill: "var(--color-muted)" }}>
                {truncate(b.label, Math.floor((b.w - 24) / CHAR_W))}
              </text>
            </g>
          ))}

          {view.edges.map((e) => {
            const a = boxOf.get(e.from);
            const b = boxOf.get(e.to);
            if (!a || !b) return null;
            const l = edgeLine(a, b);
            const mx = (l.x1 + l.x2) / 2;
            const my = (l.y1 + l.y2) / 2;
            const text = truncate(e.label, 24);
            return (
              <g key={`${e.from}|${e.to}`}>
                <line
                  x1={l.x1}
                  y1={l.y1}
                  x2={l.x2}
                  y2={l.y2}
                  strokeWidth={1.5}
                  strokeDasharray={e.implied ? "5 4" : undefined}
                  markerEnd="url(#c4-arrow)"
                  style={{ stroke: "var(--color-line)" }}
                />
                {text && (
                  <>
                    <rect
                      x={mx - (text.length * CHAR_W) / 2 - 4}
                      y={my - 9}
                      width={text.length * CHAR_W + 8}
                      height={16}
                      rx={3}
                      style={{ fill: "var(--color-bg-alt)" }}
                    />
                    <text x={mx} y={my + 3} fontSize={10} textAnchor="middle" style={{ fill: "var(--color-muted)" }}>
                      {text}
                    </text>
                  </>
                )}
              </g>
            );
          })}

          {layout.boxes.map((box) => {
            const el = byId(model, box.id);
            if (!el) return null;
            return (
              <ElementShape
                key={box.id}
                box={box}
                element={el}
                selected={selected === box.id}
                childCount={
                  el.kind === "person" || (el.kind === "system" && el.external) || el.kind === "component"
                    ? 0
                    : childrenOf(model, box.id).length
                }
                onPointerDown={(e) => startDrag(e, box)}
                onPointerMove={moveDrag}
                onPointerUp={endDrag}
                onSelect={() => onSelect(box.id)}
                onOpen={() => onOpen?.(box.id)}
              />
            );
          })}
        </svg>
      </div>

      <C4Toolbar
        scale={t.scale}
        fit={fit}
        zoom100={zoom100}
        zoomBy={zoomBy}
        onToggleFullscreen={onToggleFullscreen}
        onAutoLayout={onAutoLayout}
        canAutoLayout={canAutoLayout}
      />

      <div className={styles.canvasFooter}>
        <span className="mono-label mono-label--wide" style={{ whiteSpace: "nowrap", flex: "0 0 auto" }}>
          {"// diagrama"}
        </span>
        <span className={styles.metaText}>
          {view.nodes.length} {view.nodes.length === 1 ? "elemento" : "elementos"}
        </span>
        <div style={{ flex: "1 1 0", minWidth: 8 }} />
        <span className={styles.metaText}>
          arraste para mover · scroll para zoom · duplo clique desce um nível
        </span>
      </div>

      {empty && <div className={styles.placeholder}>{"// o diagrama aparece aqui conforme você responde"}</div>}
    </div>
  );
}
