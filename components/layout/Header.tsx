"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { VisitCounter } from "./VisitCounter";

const DOT = { width: 12, height: 12, borderRadius: "50%", display: "block" } as const;

export function Header({ onOpenPalette }: { onOpenPalette?: () => void }) {
  const pathname = usePathname();
  const onTool = pathname !== "/";

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "0 20px",
        height: 52,
        background: "var(--color-bg-alt)",
        borderBottom: "1px solid var(--color-border)",
        flexShrink: 0,
      }}
    >
      <div className="header-dots">
        <span style={{ ...DOT, background: "var(--color-danger)" }} />
        <span style={{ ...DOT, background: "var(--color-accent-yellow)" }} />
        <span style={{ ...DOT, background: "var(--color-primary)" }} />
      </div>
      <Link
        href="/"
        aria-label="Ir para a home"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          fontSize: 13,
          textDecoration: "none",
          fontFamily: "var(--font-mono)",
        }}
      >
        <span style={{ color: "var(--color-primary)" }}>tools</span>
        <span style={{ color: "var(--color-muted)" }}>.</span>
        <span style={{ color: "var(--color-accent-cyan)" }}>poderoso</span>
        <span style={{ color: "var(--color-muted)" }}>.io</span>
        {!onTool && (
          <span
            style={{
              display: "inline-block",
              width: 7,
              height: 14,
              background: "var(--color-primary)",
              marginLeft: 3,
              transform: "translateY(1px)",
              animation: "caret 1s steps(1) infinite",
            }}
          />
        )}
      </Link>
      {onTool && (
        <span className="header-tagline" style={{ fontSize: 12, color: "var(--color-muted)" }}>
          ~{pathname}
        </span>
      )}
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 16 }}>
        {onOpenPalette && (
          <button type="button" onClick={onOpenPalette} className="header-cmdk" aria-label="Buscar ferramenta">
            <span style={{ color: "var(--color-muted)" }}>buscar</span>
            <span className="header-cmdk-key">Ctrl K</span>
          </button>
        )}
        <VisitCounter />
        <Link href="https://poderoso.io" className="header-back-link">
          ← poderoso.io
        </Link>
      </div>
    </header>
  );
}
