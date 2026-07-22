"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { type NavItem, toolHref } from "@/lib/nav";
import { recordToolUse } from "@/lib/storage";

/** Abre uma ferramenta: registra o uso e navega pra rota real. */
export function useOpenTool() {
  const router = useRouter();
  return useCallback(
    (item: NavItem) => {
      recordToolUse(item.id);
      router.push(toolHref(item));
    },
    [router]
  );
}
