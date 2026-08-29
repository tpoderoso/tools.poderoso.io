import type { ReactNode } from "react";
import { ToolShell } from "@/components/layout/ToolShell";
import { ToolDocProvider } from "@/components/ui/ToolDocSlot";
import { ToolDoc } from "@/components/ui/ToolDoc";
import { ALL_TOOLS, toolHref } from "@/lib/nav";
import { TOOL_DOCS } from "@/lib/toolDocs";

type Params = Promise<{ category: string; tool: string }>;

/**
 * O manual é renderizado aqui, no servidor, e desce por contexto até o ToolPanel.
 * Ver components/ui/ToolDocSlot.tsx: é o que mantém TOOL_DOCS fora do bundle.
 */
export default async function ToolLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Params;
}) {
  const { category, tool } = await params;
  const item = ALL_TOOLS.find((t) => toolHref(t) === `/${category}/${tool}`);
  const doc = item && TOOL_DOCS[item.id];

  return (
    <ToolDocProvider doc={doc ? <ToolDoc doc={doc} /> : null}>
      <ToolShell>{children}</ToolShell>
    </ToolDocProvider>
  );
}
