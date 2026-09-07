"use client";

import { byId, type C4Model, type ElementKind } from "@/lib/tools/c4/model";
import type { C4View } from "@/lib/tools/c4/views";
import { edgeLine, type Box, type LayoutResult } from "@/lib/tools/c4/layout";
import { usePanZoom } from "@/lib/hooks/usePanZoom";
import styles from "./c4.module.css";

const KIND_COLOR: Record<ElementKind, string> = {
  person: "var(--color-secondary)",
  system: "var(--color-primary)",
  container: "var(--color-accent-cyan)",
  component: "var(--color-accent-pink)",
};

const KIND_LABEL: Record<ElementKind, string> = {
  person: "Pessoa",
  system: "Sistema",
  container: "Container",
  component: "Componente",
};

/** Largura média do IBM Plex Mono em px por caractere, na escala do desenho. */
const CHAR_W = 6.4;

function truncate(text: string, maxChars: number): string {
  return text.length <= maxChars ? text : `${text.slice(0, Math.max(0, maxChars - 1))}…`;
}

/** Quebra em até `maxLines` linhas de `perLine` caracteres, truncando o resto. */
function wrap(text: string, perLine: number, maxLines: number): string[] {
  const out: string[] = [];
  let rest = text.trim();
  while (rest && out.length < maxLines) {
    if (rest.length <= perLine) {
      out.push(rest);
      break;
    }
    const cut = rest.lastIndexOf(" ", perLine);
    const at = cut > perLine * 0.5 ? cut : perLine;
    out.push(rest.slice(0, at));
    rest = rest.slice(at).trim();
  }
  if (rest && out.length === maxLines) out[maxLines - 1] = truncate(`${out[maxLines - 1]} ${rest}`, perLine);
  return out;
}

interface Props {
  view: C4View;
  model: C4Model;
  layout: LayoutResult;
}

export function C4Canvas({ view, model, layout }: Props) {
  // a chave de refit muda quando entra ou sai um nó, e ao trocar de view; não
  // muda ao arrastar, senão a tela pularia no meio do arrasto
  const { t, grabbing, viewportRef, pointerHandlers } = usePanZoom(
    { w: layout.width, h: layout.height },
    `${view.id}:${view.nodes.length}`,
  );

  const boxOf = new Map(layout.boxes.map((b) => [b.id, b]));
  const empty = view.nodes.length === 0;

  return (
    <div className={styles.canvas}>
      <div
        ref={viewportRef}
        {...pointerHandlers}
        className={styles.viewport}
        style={{ cursor: grabbing ? "grabbing" : "grab" }}
      >
        <svg
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

          {layout.boxes.map((box) => (
            <ElementBox key={box.id} box={box} model={model} />
          ))}
        </svg>
      </div>

      {empty && <div className={styles.placeholder}>{"// o diagrama aparece aqui conforme você responde"}</div>}
    </div>
  );
}

function ElementBox({ box, model }: { box: Box; model: C4Model }) {
  const el = byId(model, box.id);
  if (!el) return null;

  const color = el.external && el.kind === "system" ? "var(--color-muted)" : KIND_COLOR[el.kind];
  const inner = Math.floor((box.w - 24) / CHAR_W);
  const meta = [KIND_LABEL[el.kind] + (el.external ? " externo" : ""), el.technology].filter(Boolean).join(": ");

  return (
    <g>
      <rect
        x={box.x}
        y={box.y}
        width={box.w}
        height={box.h}
        rx={8}
        strokeWidth={1.5}
        style={{ fill: "var(--background-secondary)", stroke: color }}
      />
      <text x={box.x + 12} y={box.y + 26} fontSize={13} style={{ fill: color }}>
        {truncate(el.name, inner)}
      </text>
      <text x={box.x + 12} y={box.y + 44} fontSize={10} style={{ fill: "var(--color-faint)" }}>
        {truncate(`[${meta}]`, inner)}
      </text>
      {wrap(el.description, inner, 2).map((line, i) => (
        <text key={i} x={box.x + 12} y={box.y + 66 + i * 14} fontSize={11} style={{ fill: "var(--color-muted-soft)" }}>
          {line}
        </text>
      ))}
    </g>
  );
}
