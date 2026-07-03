"use client";

import { useState } from "react";
import { ToolPanel } from "@/components/ui/ToolPanel";
import { CenteredColumn } from "@/components/ui/CenteredColumn";
import { GeneratorResult } from "@/components/ui/GeneratorResult";
import { ToggleButton } from "@/components/ui/ToggleButton";
import { genUUID, UUID_VERSIONS, DNS_NAMESPACE, type UuidVersion } from "@/lib/tools/uuid";
import { useOnActivate } from "@/lib/hooks/useOnActivate";

const NEEDS_NAME: UuidVersion[] = ["v3", "v5"];

export function UuidGenerator({ active }: { active: boolean }) {
  const [version, setVersion] = useState<UuidVersion>("v4");
  const [namespace, setNamespace] = useState(DNS_NAMESPACE);
  const [name, setName] = useState("exemplo.com");
  const [value, setValue] = useState("");
  const [err, setErr] = useState("");

  const regenerate = async (v: UuidVersion, ns: string, nm: string) => {
    try {
      setValue(await genUUID(v, ns, nm));
      setErr("");
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  useOnActivate(active, () => regenerate(version, namespace, name));

  const showName = NEEDS_NAME.includes(version);

  return (
    <ToolPanel path="~/generate/uuid" description="gera UUID nas versões v3, v4, v5, v6 e v7">
      <CenteredColumn style={{ padding: "32px 0", gap: 20 }}>
        <div className="uuid-version-grid">
          {UUID_VERSIONS.map((v) => (
            <ToggleButton key={v} active={version === v} onClick={() => { setVersion(v); regenerate(v, namespace, name); }}>
              {v}
            </ToggleButton>
          ))}
        </div>

        <div className="uuid-result-slot">
          {err ? (
            <div className="gen-footnote" style={{ color: "var(--color-danger)" }}>{err}</div>
          ) : (
            <GeneratorResult
              label={`// uuid ${version} gerado`}
              value={value}
              valueSize="28px"
              valueColor="var(--color-accent-cyan)"
              valueLetterSpacing="0.06em"
              regenerateLabel="Gerar novo"
              onRegenerate={() => regenerate(version, namespace, name)}
            />
          )}
        </div>

        <div className={`uuid-name-fields${showName ? "" : " uuid-name-fields--off"}`}>
          <div className="mono-label mono-label--wide">// namespace + nome (apenas v3/v5)</div>
          <div className="uuid-name-row">
            <input
              value={namespace}
              onChange={(e) => { setNamespace(e.target.value); regenerate(version, e.target.value, name); }}
              placeholder="namespace UUID"
              className="surface text-input"
              disabled={!showName}
            />
            <input
              value={name}
              onChange={(e) => { setName(e.target.value); regenerate(version, namespace, e.target.value); }}
              placeholder="nome"
              className="surface text-input"
              disabled={!showName}
            />
          </div>
        </div>
      </CenteredColumn>
    </ToolPanel>
  );
}
