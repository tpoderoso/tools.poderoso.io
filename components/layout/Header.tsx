import Link from "next/link";
import { Menu } from "lucide-react";
import { VisitCounter } from "./VisitCounter";

const DOT = { width: 12, height: 12, borderRadius: "50%", display: "block" } as const;

export function Header({ onMenuClick }: { onMenuClick?: () => void }) {
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
      <button type="button" className="menu-btn" onClick={onMenuClick} aria-label="Abrir menu">
        <Menu size={18} />
      </button>
      <div className="header-dots">
        <span style={{ ...DOT, background: "var(--color-danger)" }} />
        <span style={{ ...DOT, background: "var(--color-accent-yellow)" }} />
        <span style={{ ...DOT, background: "var(--color-primary)" }} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13 }}>
        <span style={{ color: "var(--color-primary)" }}>tools</span>
        <span style={{ color: "var(--color-muted)" }}>.</span>
        <span style={{ color: "var(--color-accent-cyan)" }}>poderoso</span>
        <span style={{ color: "var(--color-muted)" }}>.io</span>
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
      </div>
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 16 }}>
        <span
          className="header-tagline"
          style={{ fontSize: 11, color: "var(--color-line)", letterSpacing: "0.06em" }}
        >
          ferramentas para devs
        </span>
        <VisitCounter />
        <Link href="https://poderoso.io" className="header-back-link">
          ← poderoso.io
        </Link>
      </div>
    </header>
  );
}
