"use client";

import { useState } from "react";
import { ToolPanel } from "@/components/ui/ToolPanel";
import { GeneratorResult } from "@/components/ui/GeneratorResult";
import { genCPF } from "@/lib/tools/cpf";
import { useOnActivate } from "@/lib/hooks/useOnActivate";

export function CpfGenerator({ active }: { active: boolean }) {
  const [value, setValue] = useState("");

  useOnActivate(active, () => setValue(genCPF()));

  return (
    <ToolPanel path="~/generate/cpf" description="gera CPF válido para testes">
      <GeneratorResult
        label="// cpf gerado"
        value={value}
        valueSize="52px"
        valueColor="var(--color-secondary)"
        regenerateLabel="Gerar novo"
        onRegenerate={() => setValue(genCPF())}
        footnote="uso exclusivo para desenvolvimento e testes — não utilize para fins fraudulentos."
      />
    </ToolPanel>
  );
}
