"use client";

import type { ReactNode } from "react";
import { Minus, Plus, List } from "lucide-react";
import styles from "./markdown.module.css";

/** Corpo do texto em px e largura da coluna em ch — índices 0..2 nos dois casos. */
export const SIZES = [15, 17, 19];
export const WIDTHS = [58, 72, 88];

export type DocFont = "serif" | "mono";
export type DocTheme = "dark" | "sepia" | "light";

const ON = { background: "var(--color-primary-tint)", color: "var(--color-primary)" } as const;

function Btn({
  on,
  onClick,
  title,
  wide,
  children,
}: {
  on?: boolean;
  onClick?: () => void;
  title?: string;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="mmd-tool-btn"
      style={{ padding: wide ? "0 11px" : "0 9px", fontSize: 11.5, ...(on ? ON : null) }}
    >
      {children}
    </button>
  );
}

interface Props {
  font: DocFont;
  setFont: (f: DocFont) => void;
  size: number;
  setSize: (fn: (s: number) => number) => void;
  width: number;
  setWidth: (w: number) => void;
  theme: DocTheme;
  setTheme: (t: DocTheme) => void;
  toc: boolean;
  toggleToc: () => void;
  /** sem documento não há o que ajustar: controles apagados e fora de alcance */
  dim?: boolean;
}

/** Controles de leitura: família da fonte, corpo do texto, largura da coluna, tema e sumário. */
export function ReadBar({ font, setFont, size, setSize, width, setWidth, theme, setTheme, toc, toggleToc, dim }: Props) {
  return (
    <div className={styles.readbar} style={dim ? { opacity: 0.4, pointerEvents: "none" } : undefined} aria-hidden={dim}>
      <span className={`mono-label ${styles.readbarLabel}`}>{"// leitura"}</span>

      <span className={`mono-label ${styles.tag}`}>fonte</span>
      <div className="mmd-btn-group">
        <Btn wide on={font === "serif"} onClick={() => setFont("serif")}>
          serifada
        </Btn>
        <Btn wide on={font === "mono"} onClick={() => setFont("mono")}>
          mono
        </Btn>
      </div>

      <span className={`mono-label ${styles.tag}`}>corpo</span>
      <div className="mmd-btn-group">
        <Btn title="diminuir o corpo do texto" onClick={() => setSize((s) => Math.max(0, s - 1))}>
          <Minus size={15} style={{ verticalAlign: "middle" }} />
        </Btn>
        <span className={`mmd-tool-btn ${styles.num}`} style={{ fontSize: 11.5, lineHeight: "30px" }}>
          {SIZES[size]}px
        </span>
        <Btn title="aumentar o corpo do texto" onClick={() => setSize((s) => Math.min(SIZES.length - 1, s + 1))}>
          <Plus size={15} style={{ verticalAlign: "middle" }} />
        </Btn>
      </div>

      <span className={`mono-label ${styles.tag}`}>coluna</span>
      <div className="mmd-btn-group">
        <Btn wide on={width === 0} onClick={() => setWidth(0)}>
          estreita
        </Btn>
        <Btn wide on={width === 1} onClick={() => setWidth(1)}>
          média
        </Btn>
        <Btn wide on={width === 2} onClick={() => setWidth(2)}>
          larga
        </Btn>
      </div>

      <span className={`mono-label ${styles.tag}`}>tema</span>
      <div className="mmd-btn-group">
        <Btn wide on={theme === "dark"} onClick={() => setTheme("dark")}>
          escuro
        </Btn>
        <Btn wide on={theme === "sepia"} onClick={() => setTheme("sepia")}>
          sépia
        </Btn>
        <Btn wide on={theme === "light"} onClick={() => setTheme("light")}>
          claro
        </Btn>
      </div>

      <div className={styles.grow} />

      <div className="mmd-btn-group">
        <Btn wide on={toc} onClick={toggleToc} title="mostrar ou esconder o sumário">
          <span className={styles.iconLabel}>
            <List size={14} />
            sumário
          </span>
        </Btn>
      </div>
    </div>
  );
}
