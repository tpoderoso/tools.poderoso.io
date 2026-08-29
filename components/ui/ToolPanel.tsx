import type { ReactNode } from "react";
import { ALL_TOOLS, toolTitle } from "@/lib/nav";
import { Breadcrumb } from "./Breadcrumb";
import { ToolTabInputs, ToolTabs } from "./ToolTabs";
import { useToolDoc } from "./ToolDocSlot";

interface ToolPanelProps {
  path: string;
  description: string;
  children: ReactNode;
}

/**
 * Standard tool page shell: renders the `~/format/json`-style path header + description, then `children`.
 * Every tool panel (JsonFormatter, CpfGenerator, etc.) wraps its content in this for a consistent header.
 *
 * A troca ferramenta/manual é um par de radios escondidos com `:checked ~`, não
 * estado de React: a ferramenta e o texto ocupam a mesma caixa, então trocar não
 * desloca nada nem cria rolagem, e os dois painéis ficam no HTML servido (é isso
 * que faz o texto valer como conteúdo indexável).
 *
 * O manual vem pronto do servidor por contexto (ToolDocSlot), não de um import
 * de TOOL_DOCS: assim a prosa fica no HTML sem também virar JavaScript.
 */
export function ToolPanel({ path, description, children }: ToolPanelProps) {
  const item = ALL_TOOLS.find((t) => t.path === path);
  const doc = useToolDoc();

  return (
    <div
      className="tool-panel"
      style={{
        flex: 1,
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      {doc && <ToolTabInputs />}

      {/* O h1 é o nome pesquisável da ferramenta, não o caminho: quem procura busca
          por "formatador de JSON online", não por "~/format/json". O caminho continua
          visível, como breadcrumb. */}
      {item && <h1 className="visually-hidden">{toolTitle(item)}</h1>}

      <div className="tool-crumb" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11 }}>
        <Breadcrumb path={path} />
        <span style={{ color: "var(--color-line)" }}>·</span>
        <span className="desc" style={{ color: "var(--color-muted)" }}>{description}</span>

        {doc && <ToolTabs />}
      </div>

      <div className="tool-tab-panel tool-tab-panel--tool">{children}</div>

      {doc && (
        <div className="tool-tab-panel tool-tab-panel--doc">{doc}</div>
      )}
    </div>
  );
}
