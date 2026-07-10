"use client";

import { useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";
import { ToolPanel } from "@/components/ui/ToolPanel";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { ToggleButton } from "@/components/ui/ToggleButton";
import { CopyButton } from "@/components/ui/CopyButton";
import {
  GMT_OFFSETS,
  offsetLabel,
  formatInOffset,
  toEpochMs,
  parseEpoch,
} from "@/lib/tools/epoch";
import { useOnActivate } from "@/lib/hooks/useOnActivate";

function Row({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div
      style={{ display: "flex", alignItems: "center", gap: 10, minHeight: 26, flexWrap: "wrap" }}
    >
      <span
        style={{
          width: 210,
          flexShrink: 0,
          color: "var(--color-muted)",
          fontSize: 11,
        }}
      >
        {label}
      </span>
      <span style={{ color, fontSize: 13.5, letterSpacing: "0.03em" }}>
        {value}
      </span>
      <CopyButton text={value} />
    </div>
  );
}

export function EpochConverter({ active }: { active: boolean }) {
  const [now, setNow] = useState<number | null>(null);
  const [local, setLocal] = useState<{ tz: string; off: number } | null>(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [inputOffset, setInputOffset] = useState(0);
  const [epochStr, setEpochStr] = useState("");
  const [instant, setInstant] = useState<number | null>(null);
  const [err, setErr] = useState("");
  const [selected, setSelected] = useState<number[]>([]);

  useOnActivate(active, () => {
    setNow(Date.now());
    if (local) return;
    const off = -new Date().getTimezoneOffset() / 60;
    setLocal({ tz: Intl.DateTimeFormat().resolvedOptions().timeZone, off });
    const localNow = formatInOffset(Date.now(), off);
    setDate(localNow.slice(0, 10));
    setTime(localNow.slice(11));
    if (GMT_OFFSETS.includes(off)) setInputOffset(off);
  });

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active]);

  const convertToEpoch = () => {
    const ms = toEpochMs(date, time, inputOffset);
    if (Number.isNaN(ms)) return setErr("data/hora inválida");
    setErr("");
    setInstant(ms);
    setEpochStr(String(Math.floor(ms / 1000)));
  };

  const convertFromEpoch = () => {
    const ms = parseEpoch(epochStr);
    if (Number.isNaN(ms))
      return setErr("epoch inválido! Use segundos ou milissegundos");
    setErr("");
    setInstant(ms);
    const s = formatInOffset(ms, inputOffset);
    setDate(s.slice(0, 10));
    setTime(s.slice(11));
  };

  const toggleOffset = (h: number) =>
    setSelected((prev) =>
      prev.includes(h)
        ? prev.filter((x) => x !== h)
        : [...prev, h].sort((a, b) => a - b),
    );

  const shown = instant ?? now;
  const sectionLabel =
    instant !== null ? "// resultado da conversão" : "// agora (ao vivo)";

  return (
    <ToolPanel
      path="~/convert/epoch"
      description="converte data/hora ↔ epoch e mostra em vários fusos GMT"
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 24,
          width: "100%",
          maxWidth: 720,
          margin: "0 auto",
          padding: "12px 0",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div className="mono-label mono-label--wide">
            {"// data/hora → epoch"}
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="surface text-input"
              style={{ flex: "1 1 140px" }}
            />
            <input
              type="time"
              step={1}
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="surface text-input"
              style={{ flex: "1 1 120px" }}
            />
            <select
              value={inputOffset}
              onChange={(e) => setInputOffset(Number(e.target.value))}
              className="surface text-input"
              style={{ flex: "0 1 120px" }}
            >
              {GMT_OFFSETS.map((h) => (
                <option key={h} value={h}>
                  {offsetLabel(h)}
                </option>
              ))}
            </select>
            <PrimaryButton onClick={convertToEpoch}>Converter</PrimaryButton>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div className="mono-label mono-label--wide">
            {"// epoch → data/hora"}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <input
              value={epochStr}
              onChange={(e) => setEpochStr(e.target.value)}
              placeholder="segundos ou milissegundos, ex: 1751980000"
              className="surface text-input"
              style={{ flex: 1 }}
              onKeyDown={(e) => e.key === "Enter" && convertFromEpoch()}
            />
            <PrimaryButton onClick={convertFromEpoch}>Converter</PrimaryButton>
          </div>
          <div
            className="gen-footnote"
            style={{ color: "var(--color-danger)", minHeight: 16, margin: 0 }}
          >
            {err}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div className="mono-label mono-label--wide">
            {"// fusos GMT adicionais"}
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(76px, 1fr))",
              gap: 6,
            }}
          >
            {GMT_OFFSETS.filter((h) => h !== 0).map((h) => (
              <ToggleButton
                key={h}
                active={selected.includes(h)}
                onClick={() => toggleOffset(h)}
              >
                {offsetLabel(h)}
              </ToggleButton>
            ))}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 4,
            minHeight: 170,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className="mono-label mono-label--wide">{sectionLabel}</div>
            {instant !== null && (
              <PrimaryButton
                style={{ padding: "4px 10px", fontSize: 11 }}
                onClick={() => setInstant(null)}
              >
                <RotateCcw
                  size={11}
                  style={{ verticalAlign: -2, marginRight: 5 }}
                />
                voltar para agora
              </PrimaryButton>
            )}
          </div>
          {shown !== null && local !== null ? (
            <>
              <Row
                label="epoch (segundos)"
                value={String(Math.floor(shown / 1000))}
                color="var(--color-primary)"
              />
              <Row
                label="epoch (milissegundos)"
                value={String(shown)}
                color="var(--color-primary)"
              />
              <Row
                label="GMT / UTC"
                value={formatInOffset(shown, 0)}
                color="var(--color-accent-cyan)"
              />
              <Row
                label={`local — ${local.tz} (${offsetLabel(local.off)})`}
                value={formatInOffset(shown, local.off)}
                color="var(--color-accent-pink)"
              />
              {selected.map((h) => (
                <Row
                  key={h}
                  label={offsetLabel(h)}
                  value={formatInOffset(shown, h)}
                  color="var(--color-secondary)"
                />
              ))}
            </>
          ) : (
            <div className="gen-footnote" style={{ margin: 0 }}>
              —
            </div>
          )}
        </div>
      </div>
    </ToolPanel>
  );
}
