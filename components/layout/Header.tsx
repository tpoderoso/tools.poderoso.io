import Link from "next/link";

export function Header() {
  return (
    <header className="header">
      <div className="header-dots">
        <span className="header-dot" style={{ background: "var(--color-danger)" }} />
        <span className="header-dot" style={{ background: "var(--color-accent-yellow)" }} />
        <span className="header-dot" style={{ background: "var(--color-primary)" }} />
      </div>
      <div className="header-brand">
        <span style={{ color: "var(--color-primary)" }}>tools</span>
        <span style={{ color: "var(--color-muted)" }}>.</span>
        <span style={{ color: "var(--color-accent-cyan)" }}>poderoso</span>
        <span style={{ color: "var(--color-muted)" }}>.io</span>
        <span className="header-caret" />
      </div>
      <div className="header-right">
        <span className="header-tagline">ferramentas para devs</span>
        <Link href="https://poderoso.io" className="header-back-link">
          ← poderoso.io
        </Link>
      </div>
    </header>
  );
}
