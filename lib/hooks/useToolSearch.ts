"use client";

import { useMemo } from "react";
import { NAV_GROUPS } from "@/lib/nav";

/**
 * Filtra NAV_GROUPS por nome + descrição. Fonte única do índice usada tanto
 * pela home quanto pelo command palette (Ctrl+K).
 */
export function useToolSearch(query: string) {
  const q = query.trim().toLowerCase();
  return useMemo(
    () =>
      NAV_GROUPS.map((group) => ({
        ...group,
        items: group.items.filter(
          (t) => !q || t.label.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
        ),
      })).filter((group) => group.items.length > 0),
    [q]
  );
}
