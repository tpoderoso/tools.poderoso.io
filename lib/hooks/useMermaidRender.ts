"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { countNodes, normalizeSvg, themeConfig, type ThemeName } from "@/lib/tools/mermaid";

export type Status = "idle" | "rendering" | "ok" | "error";
export interface DiagramSize {
  w: number;
  h: number;
  nodes: number;
}

let renderSeq = 0;

/**
 * Renderiza `input` em SVG via mermaid (import dinâmico, `securityLevel:"strict"`).
 * Re-renderiza na troca de tema e, com `auto`, ~450ms após parar de digitar. Em
 * erro de sintaxe mantém o último diagrama válido na tela (`stale`). Retorna o
 * SVG normalizado + metadados e `renderNow` (estável) pra render sob demanda.
 */
export function useMermaidRender(input: string, theme: ThemeName, auto: boolean) {
  const [svg, setSvg] = useState("");
  const [size, setSize] = useState<DiagramSize>({ w: 0, h: 0, nodes: 0 });
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [errLine, setErrLine] = useState<number | null>(null);
  const [stale, setStale] = useState(false);

  // espelhos p/ o render assíncrono ler sempre o valor atual sem virar dependência.
  const inputRef = useRef(input);
  const themeRef = useRef(theme);
  const svgRef = useRef(svg);
  useEffect(() => {
    inputRef.current = input;
    themeRef.current = theme;
    svgRef.current = svg;
  }, [input, theme, svg]);

  const renderNow = useCallback(async () => {
    const code = inputRef.current;
    if (!code.trim()) {
      setSvg("");
      setSize({ w: 0, h: 0, nodes: 0 });
      setStatus("idle");
      setError("");
      setErrLine(null);
      setStale(false);
      return;
    }
    setStatus("rendering");
    try {
      const mermaid = (await import("mermaid")).default;
      mermaid.initialize({ startOnLoad: false, securityLevel: "strict", ...themeConfig(themeRef.current) });
      await mermaid.parse(code);
      const out = await mermaid.render(`mmd-${++renderSeq}`, code);
      const norm = normalizeSvg(out.svg);
      setSvg(norm.svg);
      setSize({ w: norm.w, h: norm.h, nodes: countNodes(norm.svg) });
      setStatus("ok");
      setError("");
      setErrLine(null);
      setStale(false);
    } catch (e) {
      const msg = String((e as Error)?.message || e || "erro ao renderizar")
        .replace(/\s+/g, " ")
        .trim();
      const lm = msg.match(/line\s+(\d+)/i);
      setError(msg.slice(0, 400));
      setErrLine(lm ? Number(lm[1]) : null);
      setStatus("error");
      setStale(!!svgRef.current); // mantém o último diagrama válido na tela
    }
  }, []);

  // troca de tema (e primeiro mount) sempre re-renderiza
  useEffect(() => {
    renderNow();
  }, [theme, renderNow]);

  // digitação re-renderiza só com auto ligado (debounce ~450ms)
  useEffect(() => {
    if (!auto) return;
    const timer = setTimeout(renderNow, 450);
    return () => clearTimeout(timer);
  }, [input, auto, renderNow]);

  return { svg, size, status, error, errLine, stale, renderNow };
}
