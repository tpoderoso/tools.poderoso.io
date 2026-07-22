"use client";

import { useEffect } from "react";
import { ALL_TOOLS } from "@/lib/nav";
import { useOpenTool } from "./useOpenTool";

function isTyping(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  return el?.tagName === "INPUT" || el?.tagName === "TEXTAREA" || el?.isContentEditable === true;
}

/**
 * Atalhos globais de teclado: Ctrl/Cmd+K chama `onPalette`; a sequência
 * `g`+tecla navega direto pra ferramenta (ex.: `g j` → JSON Formatter).
 * `onPalette` deve ser estável (useCallback) pra não re-registrar o listener.
 */
export function useToolShortcuts(onPalette: () => void) {
  const openTool = useOpenTool();

  useEffect(() => {
    let pendingG = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        pendingG = false;
        onPalette();
        return;
      }

      if (isTyping(e.target)) return;

      if (pendingG) {
        pendingG = false;
        clearTimeout(timer);
        const hit = ALL_TOOLS.find((t) => t.shortcut === `g ${e.key.toLowerCase()}`);
        if (hit) {
          e.preventDefault();
          openTool(hit);
        }
        return;
      }

      if (e.key.toLowerCase() === "g" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        pendingG = true;
        timer = setTimeout(() => {
          pendingG = false;
        }, 800);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      clearTimeout(timer);
    };
  }, [onPalette, openTool]);
}
