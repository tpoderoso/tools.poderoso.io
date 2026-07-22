"use client";

import { useEffect, useRef, useState } from "react";
import { useToolSearch } from "@/lib/hooks/useToolSearch";
import { useOpenTool } from "@/lib/hooks/useOpenTool";

/**
 * Overlay flutuante do Ctrl+K: filtra o índice e navega pra ferramenta.
 * Setas ↑/↓ movem a seleção (com wrap), Enter abre o item destacado,
 * clique/hover também selecionam. Esc fecha.
 */
export function CommandPalette({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const groups = useToolSearch(query);
  const openTool = useOpenTool();
  const selectedRef = useRef<HTMLDivElement>(null);

  const items = groups.flatMap((g) => g.items);

  useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: "nearest" });
  }, [selected]);

  function open(item: (typeof items)[number]) {
    openTool(item);
    onClose();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected((i) => (items.length ? (i + 1) % items.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected((i) => (items.length ? (i - 1 + items.length) % items.length : 0));
    } else if (e.key === "Enter") {
      const item = items[selected];
      if (item) open(item);
    } else if (e.key === "Escape") {
      onClose();
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        background: "rgba(0, 0, 0, 0.55)",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: "12vh 20px 20px",
      }}
    >
      <div
        className="surface"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 560,
          maxHeight: "70vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px" }}>
          <span style={{ color: "var(--color-primary)" }}>~ $</span>
          <input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelected(0);
            }}
            onKeyDown={onKeyDown}
            placeholder="buscar ferramenta..."
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              color: "var(--color-fg)",
              fontSize: 14,
            }}
          />
          <span
            style={{
              border: "1px solid var(--color-border)",
              borderRadius: 4,
              padding: "2px 8px",
              color: "var(--color-muted)",
              fontSize: 11,
            }}
          >
            esc
          </span>
        </div>

        <div style={{ overflowY: "auto", borderTop: "1px solid var(--color-border)" }}>
          {items.length === 0 && (
            <div style={{ padding: "18px", color: "var(--color-muted)", fontSize: 12 }}>
              nada encontrado
            </div>
          )}
          {groups.map((group) => (
            <div key={group.heading} style={{ padding: "8px 0" }}>
              <div
                style={{
                  padding: "4px 18px",
                  color: "var(--color-secondary)",
                  letterSpacing: "0.12em",
                  fontSize: 11,
                }}
              >
                {group.heading}
              </div>
              {group.items.map((t) => {
                const idx = items.indexOf(t);
                const isSelected = idx === selected;
                return (
                  <div
                    key={t.id}
                    ref={isSelected ? selectedRef : undefined}
                    onClick={() => open(t)}
                    onMouseMove={() => setSelected(idx)}
                    title={t.description}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "7px 18px",
                      cursor: "pointer",
                      color: isSelected ? "var(--color-primary)" : "var(--color-muted-soft)",
                      background: isSelected ? "var(--color-primary-tint-strong)" : "transparent",
                    }}
                  >
                    <span style={{ color: "var(--color-primary)" }}>&gt;</span>
                    <span>{t.label}</span>
                    {t.shortcut && (
                      <span style={{ marginLeft: "auto", color: "var(--color-muted)", fontSize: 11 }}>
                        {t.shortcut}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
