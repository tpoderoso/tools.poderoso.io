import type { MermaidConfig } from "mermaid";

export const INITIAL_INPUT = `flowchart TD
    A[Thiago Poderoso] --> B{Deploy?}
    B -->|sim| C[Build Docker]
    B -->|não| D[Volta pro código]
    C --> E[tools.poderoso.io]
    D --> A`;

/** Temas nativos do mermaid + um "dracula" via themeVariables casando com a paleta do app. */
export const THEMES = ["dracula", "dark", "default", "forest", "neutral"] as const;
export type ThemeName = (typeof THEMES)[number];

const DRACULA_VARS = {
  darkMode: true,
  background: "#21222c",
  primaryColor: "#282a36",
  primaryTextColor: "#f8f8f2",
  primaryBorderColor: "#bd93f9",
  secondaryColor: "#44475a",
  tertiaryColor: "#191a21",
  lineColor: "#6272a4",
  textColor: "#f8f8f2",
  noteBkgColor: "#f1fa8c",
  noteTextColor: "#21222c",
  fontFamily: "var(--font-ibm-plex-mono), monospace",
};

export function themeConfig(name: ThemeName): MermaidConfig {
  if (name === "dracula") return { theme: "base", themeVariables: DRACULA_VARS };
  return { theme: name }; // name narrowed p/ os temas nativos válidos
}

/** Fixa dimensões do svg pelo viewBox (mermaid usa max-width/100%), pra o pan/zoom e o export terem tamanho previsível. */
export function normalizeSvg(svg: string): { svg: string; w: number; h: number } {
  const vb = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
  const w = vb ? Math.ceil(parseFloat(vb[1])) : 800;
  const h = vb ? Math.ceil(parseFloat(vb[2])) : 600;
  const fixed = svg
    .replace(/style="[^"]*max-width:[^"]*"/, "")
    .replace(/width="[^"]*"/, `width="${w}"`)
    .replace(/height="[^"]*"/, `height="${h}"`)
    .replace(/<svg /, `<svg width="${w}" height="${h}" `);
  return { svg: fixed, w, h };
}

/** Conta nós pra meta do rodapé — cobre as famílias comuns (flow, er, sequence, class). */
export function countNodes(svg: string): number {
  try {
    const doc = new DOMParser().parseFromString(svg, "image/svg+xml");
    return doc.querySelectorAll(".node, .entityBox, .actor, g.classGroup").length;
  } catch {
    return 0;
  }
}

// ponytail: self-check do parsing de dimensão — roda no import (dev/build)
if (process.env.NODE_ENV !== "production" && typeof document !== "undefined") {
  const r = normalizeSvg('<svg style="max-width:100px" width="1" height="2" viewBox="0 0 120.5 60">x</svg>');
  if (r.w !== 121 || r.h !== 60) throw new Error(`mermaid.normalizeSvg: ${r.w}x${r.h} != 121x60`);
  if (/max-width/.test(r.svg)) throw new Error("mermaid.normalizeSvg: max-width não removido");
  if (!/<svg width="121" height="60"/.test(r.svg)) throw new Error("mermaid.normalizeSvg: dimensão não fixada no <svg>");
}
