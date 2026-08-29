"use client";

import { useState } from "react";
import { Maximize2, Plus, Minus, Scan } from "lucide-react";
import { toastError } from "@/components/ui/Toaster";
import { downloadBlob, svgToPngBlob } from "@/lib/tools/mermaidExport";
import type { DiagramSize } from "@/lib/hooks/useMermaidRender";
import styles from "./mermaid.module.css";

interface Props {
  svg: string;
  size: DiagramSize;
  scale: number;
  fit: () => void;
  zoom100: () => void;
  zoomBy: (f: number) => void;
  onToggleFullscreen: () => void;
}

export function DiagramToolbar({ svg, size, scale, fit, zoom100, zoomBy, onToggleFullscreen }: Props) {
  const [copiedSvg, setCopiedSvg] = useState(false);

  const copySvg = () => {
    if (!svg) return;
    navigator.clipboard?.writeText(svg);
    setCopiedSvg(true);
    setTimeout(() => setCopiedSvg(false), 1200);
  };

  const exportSvg = () =>
    svg && downloadBlob(new Blob([svg], { type: "image/svg+xml" }), "diagrama.svg");

  const exportPng = () => {
    const bg = getComputedStyle(document.body).backgroundColor;
    svgToPngBlob(svg, size.w, size.h, bg)
      .then((b) => downloadBlob(b, "diagrama.png"))
      .catch(() => toastError("Falha ao gerar PNG"));
  };

  return (
    <div className={styles.toolbarRow} onPointerDown={(e) => e.stopPropagation()}>
      <div className="mmd-btn-group">
        <button
          type="button"
          title="diminuir zoom (tecla -)"
          className="mmd-tool-btn"
          style={{ width: 30, fontSize: 15 }}
          onClick={() => zoomBy(1 / 1.2)}
        >
          <Minus size={15} style={{ verticalAlign: "middle" }} />
        </button>
        <button
          type="button"
          title="zoom 100% (tecla 1)"
          className="mmd-tool-btn"
          style={{ minWidth: 56, color: "var(--color-fg)", fontSize: 12, fontVariantNumeric: "tabular-nums" }}
          onClick={zoom100}
        >
          {Math.round(scale * 100)}%
        </button>
        <button
          type="button"
          title="aumentar zoom (tecla +)"
          className="mmd-tool-btn"
          style={{ width: 30, fontSize: 15 }}
          onClick={() => zoomBy(1.2)}
        >
          <Plus size={15} style={{ verticalAlign: "middle" }} />
        </button>
      </div>
      <div className="mmd-btn-group">
        <button type="button" title="ajustar à tela (tecla 0)" className="mmd-tool-btn" style={{ width: 32 }} onClick={fit}>
          <Scan size={15} style={{ verticalAlign: "middle" }} />
        </button>
        <button
          type="button"
          title="tela cheia (tecla f)"
          className="mmd-tool-btn"
          style={{ width: 32 }}
          onClick={onToggleFullscreen}
        >
          <Maximize2 size={15} style={{ verticalAlign: "middle" }} />
        </button>
      </div>
      <div className="mmd-btn-group">
        <button
          type="button"
          title="copiar SVG"
          className="mmd-tool-btn"
          style={{ padding: "0 10px", fontSize: 12 }}
          onClick={copySvg}
          disabled={!svg}
        >
          {copiedSvg ? "copiado ✓" : "copiar svg"}
        </button>
        <button
          type="button"
          title="baixar .svg"
          className="mmd-tool-btn"
          style={{ padding: "0 10px", fontSize: 12 }}
          onClick={exportSvg}
          disabled={!svg}
        >
          svg ↓
        </button>
        <button
          type="button"
          title="baixar .png (2x)"
          className="mmd-tool-btn"
          style={{ padding: "0 10px", fontSize: 12 }}
          onClick={exportPng}
          disabled={!svg}
        >
          png ↓
        </button>
      </div>
    </div>
  );
}
