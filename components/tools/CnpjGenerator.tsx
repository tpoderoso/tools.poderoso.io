"use client";

import { useState } from "react";
import { ToolPanel } from "@/components/ui/ToolPanel";
import { ToggleButton } from "@/components/ui/ToggleButton";
import { GeneratorResult } from "@/components/ui/GeneratorResult";
import { genCNPJ } from "@/lib/tools/cnpj";
import { useOnActivate } from "@/lib/hooks/useOnActivate";

export function CnpjGenerator({ active }: { active: boolean }) {
  const [alphanumeric, setAlphanumeric] = useState(false);
  const [value, setValue] = useState("");

  useOnActivate(active, () => setValue(genCNPJ(alphanumeric)));

  return (
    <ToolPanel path="~/generate/cnpj" description="gera CNPJ válido para testes">
      <div className="gen-actions" style={{ justifyContent: "center", paddingTop: 12 }}>
        <ToggleButton
          active={!alphanumeric}
          onClick={() => {
            setAlphanumeric(false);
            setValue(genCNPJ(false));
          }}
        >
          Numérico
        </ToggleButton>
        <ToggleButton
          active={alphanumeric}
          onClick={() => {
            setAlphanumeric(true);
            setValue(genCNPJ(true));
          }}
        >
          Alfanumérico (IN RFB 2.229/2024)
        </ToggleButton>
      </div>
      <GeneratorResult
        label="// cnpj gerado"
        value={value}
        valueSize="44px"
        valueColor="var(--color-secondary)"
        regenerateLabel="Gerar novo"
        onRegenerate={() => setValue(genCNPJ(alphanumeric))}
        footnote="uso exclusivo para desenvolvimento e testes — não utilize para fins fraudulentos."
      />
    </ToolPanel>
  );
}
