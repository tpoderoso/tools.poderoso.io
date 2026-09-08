"use client";

import { LayoutGrid, Maximize2, Minus, Plus, Scan } from "lucide-react";
import styles from "./c4.module.css";

interface Props {
  scale: number;
  fit: () => void;
  zoom100: () => void;
  zoomBy: (f: number) => void;
  onToggleFullscreen: () => void;
  onAutoLayout: () => void;
  /** false quando a view não tem nenhuma posição arrastada: nada a reorganizar. */
  canAutoLayout: boolean;
}

export function C4Toolbar({
  scale,
  fit,
  zoom100,
  zoomBy,
  onToggleFullscreen,
  onAutoLayout,
  canAutoLayout,
}: Props) {
  return (
    <div className={styles.toolbarRow} onPointerDown={(e) => e.stopPropagation()}>
      <div className="mmd-btn-group">
        <button type="button" title="diminuir zoom" className="mmd-tool-btn" style={{ width: 30 }} onClick={() => zoomBy(1 / 1.2)}>
          <Minus size={15} style={{ verticalAlign: "middle" }} />
        </button>
        <button
          type="button"
          title="zoom 100%"
          className="mmd-tool-btn"
          style={{ minWidth: 56, color: "var(--color-fg)", fontSize: 12, fontVariantNumeric: "tabular-nums" }}
          onClick={zoom100}
        >
          {Math.round(scale * 100)}%
        </button>
        <button type="button" title="aumentar zoom" className="mmd-tool-btn" style={{ width: 30 }} onClick={() => zoomBy(1.2)}>
          <Plus size={15} style={{ verticalAlign: "middle" }} />
        </button>
      </div>
      <div className="mmd-btn-group">
        <button type="button" title="ajustar à tela" className="mmd-tool-btn" style={{ width: 32 }} onClick={fit}>
          <Scan size={15} style={{ verticalAlign: "middle" }} />
        </button>
        <button
          type="button"
          title="auto-organizar (descarta as posições arrastadas nesta view)"
          className="mmd-tool-btn"
          style={{ width: 32 }}
          onClick={onAutoLayout}
          disabled={!canAutoLayout}
        >
          <LayoutGrid size={15} style={{ verticalAlign: "middle" }} />
        </button>
        <button type="button" title="tela cheia" className="mmd-tool-btn" style={{ width: 32 }} onClick={onToggleFullscreen}>
          <Maximize2 size={15} style={{ verticalAlign: "middle" }} />
        </button>
      </div>
    </div>
  );
}
