"use client";

import { useRef, type PointerEvent as ReactPointerEvent, type RefObject } from "react";
import { byId, type C4Model } from "@/lib/tools/c4/model";
import type { C4View } from "@/lib/tools/c4/views";
import { edgeLine, type Box, type LayoutResult } from "@/lib/tools/c4/layout";
import { usePanZoom } from "@/lib/hooks/usePanZoom";
import { ElementShape, truncate } from "./ElementShape";
import styles from "./c4.module.css";

/** Largura média do IBM Plex Mono em px por caractere, na escala do desenho. */
const CHAR_W = 6.4;

interface Props {
  view: C4View;
  model: C4Model;
  layout: LayoutResult;
  onOpen?: (id: string) => void;
  onMove?: (id: string, pos: { x: number; y: number }) => void;
  svgRef?: RefObject<SVGSVGElement | null>;
}

export function C4Canvas({ view, model, layout, onOpen, onMove, svgRef }: Props) {
  // a chave de refit muda quando entra ou sai um nó, e ao trocar de view; não
  // muda ao arrastar, senão a tela pularia no meio do arrasto
  const { t, grabbing, viewportRef, pointerHandlers } = usePanZoom(
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

  return (
    <div className={styles.canvas}>
      <div
        ref={viewportRef}
        {...pointerHandlers}
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
                childCount={model.elements.filter((e) => e.parent === box.id).length}
                onPointerDown={(e) => startDrag(e, box)}
                onPointerMove={moveDrag}
                onPointerUp={endDrag}
                onSelect={() => {}}
                onOpen={() => onOpen?.(box.id)}
              />
            );
          })}
        </svg>
      </div>

      {empty && <div className={styles.placeholder}>{"// o diagrama aparece aqui conforme você responde"}</div>}
    </div>
  );
}
