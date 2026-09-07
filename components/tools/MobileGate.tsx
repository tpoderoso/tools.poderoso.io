"use client";

import type { ReactNode } from "react";
import type { NavItem } from "@/lib/nav";
import { useIsMobile } from "@/lib/hooks/useIsMobile";
import { ToolPanel } from "@/components/ui/ToolPanel";

/**
 * Trava ferramentas marcadas `mobileDisabled` (lib/nav.ts) fora do desktop: em vez
 * do painel real, mostra um aviso dentro do mesmo ToolPanel (mantém breadcrumb,
 * descrição e a aba "manual"). É a rede de segurança contra qualquer caminho de
 * navegação que não tenha o próprio aviso (URL direta, atalho de teclado, etc.) —
 * HomeLauncher e CommandPalette só desabilitam a linha por antecipação de UX.
 */
export function MobileGate({ item, children }: { item: NavItem; children: ReactNode }) {
  const isMobile = useIsMobile();

  if (!isMobile) return <>{children}</>;

  return (
    <ToolPanel path={item.path} description={item.description}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          padding: "18px 16px",
          border: "1px solid var(--color-line)",
          borderRadius: 10,
          background: "var(--color-bg-alt)",
        }}
      >
        <span style={{ color: "var(--color-secondary)", fontSize: 12 }}>
          {"// disponível só no desktop"}
        </span>
        <p style={{ fontSize: 13.5, lineHeight: 1.6, color: "var(--color-fg)" }}>
          {item.label} precisa de mais espaço de tela pra funcionar bem. Abra o{" "}
          <strong>tools.poderoso.io</strong> num computador pra usar essa ferramenta.
        </p>
      </div>
    </ToolPanel>
  );
}
