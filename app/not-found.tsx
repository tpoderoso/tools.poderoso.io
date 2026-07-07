"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NotFoundHeader } from "@/components/not-found/NotFoundHeader";
import { GlitchTitle } from "@/components/not-found/GlitchTitle";
import { RecoveryTerminal } from "@/components/not-found/RecoveryTerminal";

export default function NotFound() {
  const path = usePathname();

  return (
    <div
      id="not-found-shell"
      style={{ display: "flex", flexDirection: "column", height: "100vh", background: "var(--background)", color: "var(--foreground)" }}
    >
      <NotFoundHeader />

      <main id="not-found-main" style={{ display: "flex", minHeight: 0, flex: 1, justifyContent: "center", padding: "24px 32px" }}>
        <div
          className="not-found-fade-in"
          style={{
            display: "flex",
            minHeight: 0,
            width: "100%",
            maxWidth: 840,
            flexDirection: "column",
            justifyContent: "center",
            gap: "clamp(8px, 2dvh, 24px)",
          }}
        >
          <div style={{ fontSize: 13.5, lineHeight: 1.7, color: "var(--foreground-subtle)" }}>
            <span style={{ color: "var(--primary)" }}>tools</span>@
            <span style={{ color: "var(--accent-blue)" }}>poderoso.io</span>{" "}
            <span style={{ color: "var(--accent)" }}>~</span> % cd {path}
            <br />
            <span style={{ color: "var(--accent-red)" }}>cd: no such file or directory:</span>{" "}
            <span style={{ color: "var(--foreground)" }}>{path}</span>
          </div>

          <GlitchTitle />

          <p
            style={{
              maxWidth: "46ch",
              fontFamily: "var(--font-serif)",
              fontSize: 23,
              lineHeight: 1.5,
              color: "var(--foreground-prose)",
            }}
          >
            Essa página não existe ou foi{" "}
            <span style={{ fontStyle: "italic", color: "var(--accent-pink)" }}>refatorada</span> pra fora do sistema.
            Acontece nos melhores deploys.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <Link href="/" className="not-found-btn-primary" style={{ display: "inline-flex", alignItems: "center", textDecoration: "none" }}>
              cd ~ (home)
            </Link>
            <Link
              href="https://poderoso.io"
              className="not-found-btn-outline"
              style={{ display: "inline-flex", alignItems: "center", textDecoration: "none" }}
            >
              poderoso.io ↗
            </Link>
          </div>

          <RecoveryTerminal />
        </div>
      </main>

      <footer
        style={{
          flexShrink: 0,
          borderTop: "1px solid var(--border-subtle)",
          padding: "16px 32px",
          textAlign: "center",
          fontSize: 12,
          color: "var(--foreground-subtle)",
        }}
      >
        exit code <span style={{ color: "var(--accent-red)" }}>404</span> · nenhum bit ferido na produção desta
        página
      </footer>
    </div>
  );
}
