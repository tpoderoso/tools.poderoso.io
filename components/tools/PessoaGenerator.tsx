"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { ToolPanel } from "@/components/ui/ToolPanel";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { CopyButton } from "@/components/ui/CopyButton";
import { PERSON_FIELDS, genPerson, personToJSON, personToText, regenField, type Person, type PersonField } from "@/lib/tools/pessoa";
import { useOnActivate } from "@/lib/hooks/useOnActivate";

const FIELD_COLORS: Record<PersonField, string> = {
  nome: "var(--color-primary)",
  cpf: "var(--color-secondary)",
  rg: "var(--color-accent-cyan)",
  email: "var(--color-accent-pink)",
};

export function PessoaGenerator({ active }: { active: boolean }) {
  const [pessoa, setPessoa] = useState<Person | null>(null);

  useOnActivate(active, () => setPessoa(genPerson()));

  return (
    <ToolPanel
      path="~/generate/pessoa"
      description="gera uma pessoa fictícia (nome, CPF, RG e e-mail) para testes"
    >
      <div className="gen-actions" style={{ justifyContent: "center", paddingTop: 12 }}>
        <PrimaryButton style={{ padding: "8px 16px" }} onClick={() => setPessoa(genPerson())}>
          <RotateCcw size={13} style={{ verticalAlign: -2, marginRight: 6 }} />
          Gerar nova pessoa
        </PrimaryButton>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "8px 24px",
          maxWidth: 720,
          width: "100%",
          margin: "0 auto",
          minHeight: 120,
          flexShrink: 0,
          alignContent: "start",
        }}
      >
        {pessoa &&
          PERSON_FIELDS.map(([key, label]) => (
            <div
              key={key}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 10px",
                borderRadius: 8,
                border: "1px solid var(--color-line)",
                minHeight: 52,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="mono-label" style={{ marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 15, color: FIELD_COLORS[key], overflowWrap: "anywhere" }}>
                  {pessoa[key]}
                </div>
              </div>
              <button
                type="button"
                title="Gerar de novo só este campo"
                className="btn-copy-icon"
                onClick={() => setPessoa({ ...pessoa, ...regenField(pessoa, key) })}
              >
                <RotateCcw size={13} strokeWidth={2} />
              </button>
              <CopyButton text={pessoa[key]} />
            </div>
          ))}
      </div>

      {pessoa && (
        <div className="gen-actions" style={{ justifyContent: "center" }}>
          <CopyButton variant="text" label="Copiar tudo" text={personToText(pessoa)} />
          <CopyButton variant="text" label="Copiar JSON" text={personToJSON(pessoa)} />
        </div>
      )}

      <p className="gen-footnote" style={{ margin: "0 auto" }}>
        todos os dados são fictícios, use apenas em ambientes de teste.
      </p>
    </ToolPanel>
  );
}
