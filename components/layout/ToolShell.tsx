"use client";

import { useCallback, useState, type ReactNode } from "react";
import { Header } from "./Header";
import { CommandPalette } from "@/components/tools/CommandPalette";
import { Toaster } from "@/components/ui/Toaster";
import { useToolShortcuts } from "@/lib/hooks/useToolShortcuts";

/** Shell das telas de ferramenta: chrome de terminal + Ctrl+K, sem sidebar. */
export function ToolShell({ children }: { children: ReactNode }) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const openPalette = useCallback(() => setPaletteOpen(true), []);

  useToolShortcuts(openPalette);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100dvh",
        background: "var(--color-bg)",
        color: "var(--color-fg)",
      }}
    >
      <Header onOpenPalette={openPalette} />
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>{children}</div>
      {paletteOpen && <CommandPalette onClose={() => setPaletteOpen(false)} />}
      <Toaster />
    </div>
  );
}
