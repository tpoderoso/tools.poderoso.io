"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Star } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { ALL_TOOLS, NAV_GROUPS, type ToolId } from "@/lib/nav";
import { getFavorites, getUsage, toggleFavorite } from "@/lib/storage";
import { useToolSearch } from "@/lib/hooks/useToolSearch";
import { useOpenTool } from "@/lib/hooks/useOpenTool";
import { useToolShortcuts } from "@/lib/hooks/useToolShortcuts";

export function HomeLauncher() {
  const [query, setQuery] = useState("");
  const [favorites, setFavorites] = useState<ToolId[]>([]);
  const [usage, setUsage] = useState<Partial<Record<ToolId, number>>>({});
  const inputRef = useRef<HTMLInputElement>(null);
  const openTool = useOpenTool();
  const filteredGroups = useToolSearch(query);

  // Ctrl+K na home foca o prompt herói (índice já está todo à mostra).
  const focusInput = useCallback(() => inputRef.current?.focus(), []);
  useToolShortcuts(focusInput);

  const refresh = () => {
    setFavorites(getFavorites());
    setUsage(getUsage());
  };

  // Lê localStorage só depois do mount (client-only) para não divergir do SSR.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(refresh, []);

  function handlePinClick(e: React.MouseEvent, id: ToolId) {
    e.stopPropagation();
    setFavorites(toggleFavorite(id));
  }

  function openFirstResult() {
    const first = filteredGroups[0]?.items[0];
    if (first) openTool(first);
  }

  const pinnedItems = favorites
    .map((id) => ALL_TOOLS.find((t) => t.id === id))
    .filter((t): t is NonNullable<typeof t> => Boolean(t));

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
      <Header onOpenPalette={focusInput} />
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          display: "flex",
          justifyContent: "center",
          padding: "56px 36px 40px",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 1100,
            display: "flex",
            flexDirection: "column",
            gap: 36,
          }}
        >
          {/* busca */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 14,
              alignItems: "center",
            }}
          >
            <div
              className="surface"
              style={{
                width: "100%",
                maxWidth: 720,
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "16px 22px",
                fontSize: 15,
              }}
            >
              <span style={{ color: "var(--color-primary)" }}>~ $</span>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") openFirstResult();
                  if (e.key === "Escape") {
                    setQuery("");
                    inputRef.current?.blur();
                  }
                }}
                placeholder="buscar ferramenta..."
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  color: "var(--color-fg)",
                  fontSize: 15,
                }}
              />
              <span
                style={{
                  border: "1px solid var(--color-border)",
                  borderRadius: 4,
                  padding: "2px 8px",
                  color: "var(--color-muted)",
                  fontSize: 12,
                  background: "var(--color-bg-alt)",
                }}
              >
                Ctrl K
              </span>
            </div>
            <div style={{ color: "var(--color-muted)", fontSize: 12 }}>
              digite pra filtrar o índice abaixo em tempo real · Enter abre o
              primeiro resultado
            </div>
          </div>

          {/* fixadas */}
          {pinnedItems.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                <span
                  style={{
                    color: "var(--color-accent-yellow)",
                    fontSize: 13,
                    letterSpacing: "0.12em",
                  }}
                >
                  ★ FIXADAS
                </span>
                <span
                  style={{
                    flex: 1,
                    borderBottom: "1px solid var(--color-border)",
                  }}
                />
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {pinnedItems.map((t) => (
                  <span
                    key={t.id}
                    className="home-chip"
                    onClick={() => openTool(t)}
                    title={t.description}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      border: "1px solid var(--color-border)",
                      background: "var(--background-secondary)",
                      borderRadius: 5,
                      padding: "7px 10px 7px 14px",
                      color: "var(--color-fg)",
                      cursor: "pointer",
                      fontSize: 13,
                    }}
                  >
                    {t.label}
                    <Star
                      size={13}
                      fill="var(--color-accent-yellow)"
                      color="var(--color-accent-yellow)"
                      onClick={(e) => handlePinClick(e, t.id)}
                    />
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* índice */}
          <div className="home-index-grid">
            {filteredGroups.map((group) => (
              <div
                key={group.heading}
                style={{ display: "flex", flexDirection: "column", gap: 8 }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 10,
                    borderBottom: "1px solid var(--color-border)",
                    paddingBottom: 8,
                  }}
                >
                  <span
                    style={{
                      color: "var(--color-secondary)",
                      letterSpacing: "0.12em",
                      fontSize: 12,
                    }}
                  >
                    {group.heading}
                  </span>
                  <span style={{ color: "var(--color-muted)", fontSize: 12 }}>
                    {group.items.length}
                  </span>
                </div>
                {group.items.map((t) => {
                  const isPinned = favorites.includes(t.id);
                  return (
                    <div
                      key={t.id}
                      className="home-index-row"
                      onClick={() => openTool(t)}
                      title={t.description}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "4px 0",
                        cursor: "pointer",
                        color: "var(--color-muted-soft)",
                      }}
                    >
                      <span style={{ color: "var(--color-primary)" }}>
                        &gt;
                      </span>
                      <span>{t.label}</span>
                      <span
                        className="home-index-leader"
                        style={{
                          flex: 1,
                          borderBottom: "1px dotted var(--color-border)",
                          transform: "translateY(-3px)",
                        }}
                      />
                      <span
                        style={{ color: "var(--color-muted)", fontSize: 12 }}
                      >
                        {usage[t.id] ?? 0}
                      </span>
                      <Star
                        size={13}
                        fill={isPinned ? "var(--color-accent-yellow)" : "none"}
                        color={
                          isPinned
                            ? "var(--color-accent-yellow)"
                            : "var(--color-line)"
                        }
                        onClick={(e) => handlePinClick(e, t.id)}
                      />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* rodapé */}
          <div
            style={{
              color: "var(--color-muted)",
              fontSize: 12,
              borderTop: "1px solid var(--color-border)",
              paddingTop: 16,
              display: "flex",
              gap: 24,
              flexWrap: "wrap",
            }}
          >
            <span>hover mostra descrição</span>
            <span style={{ flex: 1 }} />
            <span>
              {ALL_TOOLS.length} ferramentas · {NAV_GROUPS.length} categorias
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
