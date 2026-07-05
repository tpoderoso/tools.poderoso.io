import Link from "next/link";

const DOT = { width: 12, height: 12, borderRadius: "50%", display: "block" } as const;

/** Barra de topo minimalista do 404: dots de terminal + breadcrumb + volta pra home */
export function NotFoundHeader() {
  return (
    <header
      style={{
        borderBottom: "1px solid var(--border-subtle)",
        background: "color-mix(in srgb, var(--background-alt) 82%, transparent)",
      }}
    >
      <div
        style={{
          margin: "0 auto",
          display: "flex",
          maxWidth: 1180,
          alignItems: "center",
          gap: 20,
          padding: "13px 32px",
        }}
      >
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ ...DOT, background: "var(--accent-red)" }} />
          <span style={{ ...DOT, background: "var(--accent-yellow)" }} />
          <span style={{ ...DOT, background: "var(--accent-green)" }} />
        </div>
        <span style={{ fontSize: 13, color: "var(--foreground-subtle)" }}>
          <span style={{ color: "var(--primary)" }}>tools</span>@
          <span style={{ color: "var(--accent-blue)" }}>poderoso.io</span>:{" "}
          <span style={{ color: "var(--accent-red)" }}>/404</span>
        </span>
        <Link
          href="/"
          className="not-found-back-link"
          style={{ marginLeft: "auto", fontSize: 13, textDecoration: "none" }}
        >
          ← voltar pra home
        </Link>
      </div>
    </header>
  );
}
