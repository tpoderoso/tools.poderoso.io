"use client";

import { createContext, useContext, type ReactNode } from "react";

/**
 * O manual da ferramenta chega pronto do servidor, como nó já renderizado.
 *
 * Ele não vem por prop porque quem monta o ToolPanel são os 23 painéis, todos
 * client components no meio do caminho. Passar por contexto mantém `lib/toolDocs.ts`
 * (31KB gzip de prosa) inteiramente no servidor: o texto continua no HTML servido,
 * que é o que o Google indexa, mas não é reenviado como JavaScript pro navegador.
 */
const ToolDocContext = createContext<ReactNode>(null);

export function ToolDocProvider({ doc, children }: { doc: ReactNode; children: ReactNode }) {
  return <ToolDocContext.Provider value={doc}>{children}</ToolDocContext.Provider>;
}

/** O manual da ferramenta atual, ou `null` se ela não tiver um. */
export function useToolDoc(): ReactNode {
  return useContext(ToolDocContext);
}
