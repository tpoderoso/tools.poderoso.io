"use client";

import type { PointerEvent as ReactPointerEvent } from "react";
import { shapeFor, type Shape } from "@/lib/tools/c4/shape";
import type { C4Element, ElementKind } from "@/lib/tools/c4/model";
import type { Box } from "@/lib/tools/c4/layout";

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

/**
 * Espaço que o contorno de cada forma rouba do texto. `top` é o que a cabeça, a
 * elipse ou a barra de título ocupam acima do conteúdo; `side` é a folga
 * lateral (maior no bucket, que é um trapézio e estreita para baixo).
 */
const INSET: Record<Shape, { top: number; side: number }> = {
  default: { top: 0, side: 12 },
  person: { top: 42, side: 12 },
  database: { top: 16, side: 12 },
  queue: { top: 0, side: 22 },
  browser: { top: 20, side: 12 },
  mobile: { top: 14, side: 12 },
  cli: { top: 18, side: 12 },
  folder: { top: 12, side: 12 },
  blob: { top: 14, side: 28 },
};

export function truncate(text: string, maxChars: number): string {
  return text.length <= maxChars ? text : `${text.slice(0, Math.max(0, maxChars - 1))}…`;
}

/** Quebra em até `maxLines` linhas de `perLine` caracteres, truncando o resto. */
export function wrap(text: string, perLine: number, maxLines: number): string[] {
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

/**
 * O contorno da forma. Todas as formas ocupam exatamente a mesma caixa de
 * colisão `box` — é o que permite arrasto, `edgeLine()` e boundaries
 * continuarem funcionando sem saber que forma é.
 */
function Outline({ shape, box, color }: { shape: Shape; box: Box; color: string }) {
  const { x, y, w, h } = box;
  const fill = "var(--background-secondary)";
  const s = { fill, stroke: color };
  const stroked = { fill: "none", stroke: color };

  switch (shape) {
    case "person": {
      const bodyY = y + 30;
      return (
        <>
          <circle cx={x + w / 2} cy={y + 15} r={14} strokeWidth={1.5} style={s} />
          <rect x={x} y={bodyY} width={w} height={h - 30} rx={14} strokeWidth={1.5} style={s} />
        </>
      );
    }
    case "database": {
      const ry = 12;
      return (
        <>
          <path
            d={`M ${x} ${y + ry} V ${y + h - ry} A ${w / 2} ${ry} 0 0 0 ${x + w} ${y + h - ry} V ${y + ry}`}
            strokeWidth={1.5}
            style={s}
          />
          <ellipse cx={x + w / 2} cy={y + ry} rx={w / 2} ry={ry} strokeWidth={1.5} style={s} />
        </>
      );
    }
    case "queue": {
      const rx = 16;
      return (
        <>
          <rect x={x} y={y} width={w} height={h} rx={rx} ry={h / 2} strokeWidth={1.5} style={s} />
          <path d={`M ${x + w - rx} ${y} A ${rx} ${h / 2} 0 0 0 ${x + w - rx} ${y + h}`} strokeWidth={1.5} style={stroked} />
        </>
      );
    }
    case "browser":
      return (
        <>
          <rect x={x} y={y} width={w} height={h} rx={8} strokeWidth={1.5} style={s} />
          <line x1={x} y1={y + 20} x2={x + w} y2={y + 20} strokeWidth={1.5} style={stroked} />
          {[14, 25, 36].map((dx) => (
            <circle key={dx} cx={x + dx} cy={y + 10} r={2.5} style={{ fill: color }} />
          ))}
        </>
      );
    case "mobile":
      return (
        <>
          <rect x={x} y={y} width={w} height={h} rx={14} strokeWidth={1.5} style={s} />
          <rect x={x + w / 2 - 22} y={y + 5} width={44} height={5} rx={2.5} style={{ fill: color }} />
        </>
      );
    case "cli":
      return (
        <>
          <rect x={x} y={y} width={w} height={h} rx={8} strokeWidth={1.5} style={s} />
          <text x={x + 12} y={y + 16} fontSize={11} style={{ fill: color }}>
            {">_"}
          </text>
        </>
      );
    case "folder":
      return (
        <>
          <rect x={x} y={y} width={64} height={16} rx={4} strokeWidth={1.5} style={s} />
          <rect x={x} y={y + 10} width={w} height={h - 10} rx={8} strokeWidth={1.5} style={s} />
        </>
      );
    case "blob": {
      const ry = 12;
      const inset = 24;
      return (
        <>
          <path
            d={`M ${x} ${y + ry} L ${x + inset} ${y + h} H ${x + w - inset} L ${x + w} ${y + ry}`}
            strokeWidth={1.5}
            style={s}
          />
          <ellipse cx={x + w / 2} cy={y + ry} rx={w / 2} ry={ry} strokeWidth={1.5} style={s} />
        </>
      );
    }
    default:
      return <rect x={x} y={y} width={w} height={h} rx={8} strokeWidth={1.5} style={s} />;
  }
}

interface Props {
  box: Box;
  element: C4Element;
  selected?: boolean;
  childCount: number;
  onPointerDown: (e: ReactPointerEvent<SVGGElement>) => void;
  onPointerMove: (e: ReactPointerEvent<SVGGElement>) => void;
  onPointerUp: () => void;
  onSelect: () => void;
  onOpen?: () => void;
}

export function ElementShape({
  box,
  element: el,
  selected,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onSelect,
  onOpen,
}: Props) {
  const shape = shapeFor(el);
  const color = el.external && el.kind === "system" ? "var(--color-muted)" : KIND_COLOR[el.kind];
  const { top, side } = INSET[shape];
  const inner = Math.floor((box.w - side * 2) / CHAR_W);
  const tx = box.x + side;
  const ty = box.y + top;
  const meta = [KIND_LABEL[el.kind] + (el.external ? " externo" : ""), el.technology].filter(Boolean).join(": ");

  return (
    <g
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onOpen?.();
      }}
      style={{ cursor: "pointer" }}
      opacity={selected ? 1 : 0.94}
    >
      <Outline shape={shape} box={box} color={color} />
      <text x={tx} y={ty + 26} fontSize={13} style={{ fill: color }}>
        {truncate(el.name, inner)}
      </text>
      <text x={tx} y={ty + 44} fontSize={10} style={{ fill: "var(--color-faint)" }}>
        {truncate(`[${meta}]`, inner)}
      </text>
      {wrap(el.description, inner, 2).map((line, i) => (
        <text key={i} x={tx} y={ty + 66 + i * 14} fontSize={11} style={{ fill: "var(--color-muted-soft)" }}>
          {line}
        </text>
      ))}
    </g>
  );
}
