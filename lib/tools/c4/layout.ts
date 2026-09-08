import { byId, type C4Model } from "./model.ts";
import { buildView, type C4View } from "./views.ts";
import { exampleModel } from "./example.ts";

export interface Box {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface BoundaryBox {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface LayoutResult {
  boxes: Box[];
  boundaries: BoundaryBox[];
  width: number;
  height: number;
}

/**
 * Tamanho fixo por tipo. Fixo porque medir texto exigiria DOM (e estes módulos
 * são puros), e porque caixa que cresce com o texto causa layout shift.
 * O texto que não couber é truncado no componente.
 */
const SIZE = {
  // 150 e não 120: a forma de pessoa reserva 42px no topo para a cabeça
  // (ver INSET em components/tools/c4/ElementShape.tsx)
  person: { w: 240, h: 150 },
  system: { w: 240, h: 120 },
  container: { w: 220, h: 110 },
  component: { w: 220, h: 110 },
} as const;

const GAP = 40; // entre caixas da mesma faixa
const BAND_GAP = 90; // entre faixas
const MARGIN = 40; // borda do desenho
const PAD = 24; // respiro do boundary em volta dos filhos
const HEADER = 28; // altura do rótulo do boundary
const PER_ROW = 4; // caixas por linha antes de quebrar

interface Band {
  ids: string[];
  boundary?: string;
}

/** Faixas horizontais, de cima para baixo. */
function bands(model: C4Model, view: C4View): Band[] {
  const kindOf = (id: string) => byId(model, id)?.kind;
  const persons = view.nodes.filter((id) => kindOf(id) === "person");
  const boundary = view.boundaries[0];

  if (boundary) {
    const inside = view.nodes.filter((id) => boundary.children.includes(id));
    const rest = view.nodes.filter((id) => kindOf(id) !== "person" && !boundary.children.includes(id));
    return [{ ids: persons }, { ids: inside, boundary: boundary.id }, { ids: rest }];
  }

  const isExternal = (id: string) => byId(model, id)?.external === true;
  const systems = view.nodes.filter((id) => kindOf(id) === "system");
  return [
    { ids: persons },
    { ids: systems.filter((id) => !isExternal(id)) },
    { ids: systems.filter(isExternal) },
  ];
}

function rowsOf(ids: string[]): string[][] {
  const rows: string[][] = [];
  for (let i = 0; i < ids.length; i += PER_ROW) rows.push(ids.slice(i, i + PER_ROW));
  return rows;
}

function sizeOf(model: C4Model, id: string) {
  return SIZE[byId(model, id)?.kind ?? "container"];
}

function bandSize(model: C4Model, ids: string[]): { w: number; h: number } {
  if (!ids.length) return { w: 0, h: 0 };
  const rows = rowsOf(ids);
  let w = 0;
  let h = 0;
  for (const row of rows) {
    const rw = row.reduce((acc, id) => acc + sizeOf(model, id).w, 0) + GAP * (row.length - 1);
    w = Math.max(w, rw);
    h += Math.max(...row.map((id) => sizeOf(model, id).h));
  }
  return { w, h: h + GAP * (rows.length - 1) };
}

/**
 * Posições calculadas, com `saved` (o que a pessoa arrastou) sempre vencendo.
 *
 * ponytail: arrastar uma caixa para fora do boundary deixa o retângulo tracejado
 * sem envolvê-la. Aceito: o boundary é pista visual, não restrição. Se incomodar,
 * recalcular o retângulo a partir das caixas finais resolve.
 */
export function autoLayout(
  view: C4View,
  model: C4Model,
  saved: Record<string, { x: number; y: number }> = {},
): LayoutResult {
  const bs = bands(model, view).filter((b) => b.ids.length > 0);
  const sizes = bs.map((b) => {
    const s = bandSize(model, b.ids);
    return b.boundary ? { w: s.w + PAD * 2, h: s.h + PAD * 2 + HEADER } : s;
  });
  const contentW = Math.max(0, ...sizes.map((s) => s.w));

  const boxes: Box[] = [];
  const boundaries: BoundaryBox[] = [];
  let y = MARGIN;

  bs.forEach((band, bi) => {
    const size = sizes[bi];
    const bandX = MARGIN + (contentW - size.w) / 2;
    let originX = bandX;
    let originY = y;
    let innerW = size.w;

    if (band.boundary) {
      boundaries.push({
        id: band.boundary,
        label: byId(model, band.boundary)?.name ?? band.boundary,
        x: bandX,
        y,
        w: size.w,
        h: size.h,
      });
      originX = bandX + PAD;
      originY = y + HEADER + PAD;
      innerW = size.w - PAD * 2;
    }

    let ry = originY;
    for (const row of rowsOf(band.ids)) {
      const rw = row.reduce((acc, id) => acc + sizeOf(model, id).w, 0) + GAP * (row.length - 1);
      let rx = originX + (innerW - rw) / 2;
      let rowH = 0;
      for (const id of row) {
        const s = sizeOf(model, id);
        boxes.push({ id, x: rx, y: ry, w: s.w, h: s.h });
        rx += s.w + GAP;
        rowH = Math.max(rowH, s.h);
      }
      ry += rowH + GAP;
    }

    y += size.h + BAND_GAP;
  });

  for (const b of boxes) {
    const p = saved[b.id];
    if (p) {
      b.x = p.x;
      b.y = p.y;
    }
  }

  const right = [...boxes.map((b) => b.x + b.w), ...boundaries.map((b) => b.x + b.w), 0];
  const bottom = [...boxes.map((b) => b.y + b.h), ...boundaries.map((b) => b.y + b.h), 0];
  return { boxes, boundaries, width: Math.max(...right) + MARGIN, height: Math.max(...bottom) + MARGIN };
}

/** Onde a reta centro a centro corta a borda de `box`, indo na direção do ponto dado. */
function clip(box: Box, towardX: number, towardY: number): { x: number; y: number } {
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  const dx = towardX - cx;
  const dy = towardY - cy;
  if (dx === 0 && dy === 0) return { x: cx, y: cy };
  const sx = dx === 0 ? Infinity : box.w / 2 / Math.abs(dx);
  const sy = dy === 0 ? Infinity : box.h / 2 / Math.abs(dy);
  const s = Math.min(sx, sy);
  return { x: cx + dx * s, y: cy + dy * s };
}

/** Segmento entre duas caixas, cortado na borda das duas. */
export function edgeLine(a: Box, b: Box): { x1: number; y1: number; x2: number; y2: number } {
  const ac = { x: a.x + a.w / 2, y: a.y + a.h / 2 };
  const bc = { x: b.x + b.w / 2, y: b.y + b.h / 2 };
  const p1 = clip(a, bc.x, bc.y);
  const p2 = clip(b, ac.x, ac.y);
  return { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y };
}

// ponytail: self-check — roda no import (dev/build) e via `node lib/tools/c4/layout.ts`
if (process.env.NODE_ENV !== "production") {
  const fail = (what: string, detail = "") => {
    throw new Error(`c4/layout ${what}${detail ? `: ${detail}` : ""}`);
  };
  const m = exampleModel();

  const land = autoLayout(buildView(m, "landscape"), m);
  const overlaps = (a: Box, b: Box) =>
    a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
  for (let i = 0; i < land.boxes.length; i++)
    for (let j = i + 1; j < land.boxes.length; j++)
      if (overlaps(land.boxes[i], land.boxes[j]))
        fail("caixas se sobrepoem", `${land.boxes[i].id} e ${land.boxes[j].id}`);
  if (land.boxes.length !== 5) fail("landscape deveria ter 5 caixas", String(land.boxes.length));
  if (land.width <= 0 || land.height <= 0) fail("dimensao do desenho nao pode ser zero");

  const cont = autoLayout(buildView(m, "container:checkout"), m);
  const bnd = cont.boundaries[0];
  if (!bnd) fail("view de container precisa de boundary");
  else
    for (const id of ["web", "api", "banco", "worker"]) {
      const box = cont.boxes.find((b) => b.id === id);
      if (!box) fail("caixa faltando no boundary", id);
      else if (box.x < bnd.x || box.y < bnd.y || box.x + box.w > bnd.x + bnd.w || box.y + box.h > bnd.y + bnd.h)
        fail("boundary nao envolve o filho", id);
    }

  const moved = autoLayout(buildView(m, "container:checkout"), m, { api: { x: 999, y: 888 } });
  const apiBox = moved.boxes.find((b) => b.id === "api");
  if (apiBox?.x !== 999 || apiBox?.y !== 888) fail("posicao arrastada tem que vencer o calculo");

  const a: Box = { id: "a", x: 0, y: 0, w: 100, h: 100 };
  const b: Box = { id: "b", x: 300, y: 0, w: 100, h: 100 };
  const l = edgeLine(a, b);
  if (l.x1 !== 100 || l.y1 !== 50) fail("seta deveria sair na borda direita de a", JSON.stringify(l));
  if (l.x2 !== 300 || l.y2 !== 50) fail("seta deveria chegar na borda esquerda de b", JSON.stringify(l));
}
