"use client";

import { useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";
import { ToolPanel } from "@/components/ui/ToolPanel";
import { ToggleButton } from "@/components/ui/ToggleButton";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { CopyButton } from "@/components/ui/CopyButton";
import { COMPANY_FIELDS, ESTABS, companyToJSON, companyToText, genCompany, regenField, type Company, type EstabId } from "@/lib/tools/company";
import { UFS, type UF } from "@/lib/tools/ie";
import { getEstablishmentType, setEstablishmentType } from "@/lib/storage";
import { useOnActivate } from "@/lib/hooks/useOnActivate";

const selectStyle: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: 8,
  fontFamily: "var(--font-mono)",
  fontSize: 11.5,
  cursor: "pointer",
  border: "1px solid var(--color-line)",
  background: "var(--color-bg-alt)",
  color: "var(--color-fg)",
};

const FIELD_COLORS: Partial<Record<(typeof COMPANY_FIELDS)[number][0], string>> = {
  razaoSocial: "var(--color-primary)",
  nomeFantasia: "var(--color-accent-cyan)",
  cnpj: "var(--color-secondary)",
  inscricaoEstadual: "var(--color-accent-pink)",
  inscricaoMunicipal: "var(--color-accent-yellow)",
};

export function CompanyGenerator({ active }: { active: boolean }) {
  const [alphanumeric, setAlphanumeric] = useState(false);
  const [uf, setUf] = useState<UF | "">("");
  const [tipo, setTipo] = useState<EstabId | "">("");
  const [company, setCompany] = useState<Company | null>(null);

  const generate = (alpha = alphanumeric, state = uf, tp = tipo) =>
    setCompany(genCompany({ alphanumericCnpj: alpha, uf: state || undefined, tipo: tp }));

  // Lê o tipo salvo só depois do mount (client-only) para não divergir do SSR.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setTipo(getEstablishmentType()), []);

  // Na primeira abertura, gera já respeitando o tipo salvo (o estado ainda pode
  // não ter assentado, então lemos direto do storage).
  useOnActivate(active, () => generate(alphanumeric, uf, getEstablishmentType()));

  return (
    <ToolPanel
      path="~/generate/empresa"
      description="gera uma empresa fictícia completa para cadastros de teste"
    >
      <div className="gen-actions" style={{ justifyContent: "center", paddingTop: 12, flexWrap: "wrap" }}>
        <ToggleButton
          active={!alphanumeric}
          onClick={() => {
            setAlphanumeric(false);
            generate(false);
          }}
        >
          CNPJ numérico
        </ToggleButton>
        <ToggleButton
          active={alphanumeric}
          onClick={() => {
            setAlphanumeric(true);
            generate(true);
          }}
        >
          CNPJ alfanumérico
        </ToggleButton>
        <select
          value={tipo}
          onChange={(e) => {
            const next = e.target.value as EstabId | "";
            setTipo(next);
            setEstablishmentType(next);
            generate(alphanumeric, uf, next);
          }}
          title="Tipo de estabelecimento (fica salvo para a próxima visita)"
          style={selectStyle}
        >
          <option value="">Tipo aleatório</option>
          {ESTABS.map((e) => (
            <option key={e.id} value={e.id}>
              {e.label}
            </option>
          ))}
        </select>
        <select
          value={uf}
          onChange={(e) => {
            const next = e.target.value as UF | "";
            setUf(next);
            generate(alphanumeric, next);
          }}
          title="UF da Inscrição Estadual, endereço e DDD"
          style={selectStyle}
        >
          <option value="">UF aleatória</option>
          {UFS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <PrimaryButton style={{ padding: "8px 16px" }} onClick={() => generate()}>
          <RotateCcw size={13} style={{ verticalAlign: -2, marginRight: 6 }} />
          Gerar nova empresa
        </PrimaryButton>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "8px 24px",
          maxWidth: 900,
          width: "100%",
          margin: "0 auto",
          minHeight: 420,
          flexShrink: 0,
          alignContent: "start",
        }}
      >
        {company &&
          COMPANY_FIELDS.map(([key, label]) => (
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
                <div
                  style={{
                    fontSize: 13,
                    color: FIELD_COLORS[key] ?? "var(--color-fg)",
                    overflowWrap: "anywhere",
                  }}
                >
                  {company[key]}
                </div>
              </div>
              <button
                type="button"
                title="Gerar de novo só este campo"
                className="btn-copy-icon"
                onClick={() => {
                  const patch = regenField(company, key, { alphanumericCnpj: alphanumeric, tipo });
                  if (patch.uf) setUf(patch.uf as UF);
                  setCompany({ ...company, ...patch });
                }}
              >
                <RotateCcw size={13} strokeWidth={2} />
              </button>
              <CopyButton text={company[key]} />
            </div>
          ))}
      </div>

      {company && (
        <div className="gen-actions" style={{ justifyContent: "center" }}>
          <CopyButton variant="text" label="Copiar tudo" text={companyToText(company)} />
          <CopyButton variant="text" label="Copiar JSON" text={companyToJSON(company)} />
        </div>
      )}

      <p className="gen-footnote" style={{ margin: "0 auto" }}>
        todos os dados são fictícios, use apenas em ambientes de teste.
      </p>
    </ToolPanel>
  );
}
