"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { Braces, Check, RotateCcw } from "lucide-react";
import { ToolPanel } from "@/components/ui/ToolPanel";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { CopyButton } from "@/components/ui/CopyButton";
import { Select } from "@/components/ui/Select";
import { COMPANY_FIELDS, ESTABS, companyToJSON, companyToText, genCompany, regenField, type Company, type CompanyField, type EstabId } from "@/lib/tools/company";
import { UFS, type UF } from "@/lib/tools/ie";
import { getEstablishmentType, setEstablishmentType } from "@/lib/storage";
import { useCopy } from "@/lib/hooks/useCopy";
import { useOnActivate } from "@/lib/hooks/useOnActivate";

const LABELS = Object.fromEntries(COMPANY_FIELDS) as Record<CompanyField, string>;

interface Slot {
  key: CompanyField;
  /** ocupa a linha inteira em vez de dividir com o campo vizinho */
  wide?: boolean;
  size?: number;
  color?: string;
}

/**
 * A ficha em duas camadas. Os 19 campos não têm o mesmo peso: os cinco de cima
 * são os que se copiam a toda hora num cadastro de teste, então vão em corpo
 * grande; o resto é dado de apoio, denso, dois por linha quando o valor é curto.
 */
const DESTAQUE: Slot[] = [
  { key: "nomeFantasia", wide: true, size: 24, color: "var(--color-primary)" },
  { key: "cnpj", wide: true, size: 21, color: "var(--color-secondary)" },
  { key: "razaoSocial", wide: true, size: 15 },
  { key: "inscricaoEstadual", size: 15, color: "var(--color-accent-pink)" },
  { key: "inscricaoMunicipal", size: 15, color: "var(--color-accent-yellow)" },
];

const FICHA: Slot[] = [
  { key: "naturezaJuridica", wide: true },
  { key: "cnae", wide: true },
  { key: "porte" },
  { key: "regimeTributario" },
  { key: "capitalSocial" },
  { key: "dataAbertura" },
  { key: "endereco", wide: true },
  { key: "municipio" },
  { key: "uf" },
  { key: "cep" },
  { key: "telefone" },
  { key: "celular" },
  { key: "email", color: "var(--color-accent-cyan)" },
  { key: "site", color: "var(--color-accent-cyan)" },
];

// Um campo novo em Company some da tela sem erro nenhum, então o aviso é aqui:
if (process.env.NODE_ENV !== "production") {
  const postos = new Set([...DESTAQUE, ...FICHA].map((s) => s.key));
  const fora = COMPANY_FIELDS.filter(([key]) => !postos.has(key)).map(([key]) => key);
  if (fora.length) console.warn(`CompanyGenerator: campos fora do layout: ${fora.join(", ")}`);
}

/** Metade do segmentado de formato do CNPJ: mesma caixa de 34px dos selects. */
const seg = (on: boolean): CSSProperties => ({
  padding: "0 12px",
  border: "none",
  background: on ? "var(--color-primary-tint)" : "transparent",
  color: on ? "var(--color-primary)" : "var(--color-muted-soft)",
  fontFamily: "var(--font-mono)",
  fontSize: 11.5,
  cursor: "pointer",
});

/**
 * Uma linha da ficha. O valor é um botão porque clicar nele copia — assim o campo
 * também é alcançável pelo teclado, o que um `<span>` com onClick não seria.
 * A confirmação ocupa o lugar do botão de regerar em vez de somar ao lado dele,
 * senão a linha daria um pulo a cada cópia.
 */
function FieldCell({ slot, value, onRegen }: { slot: Slot; value: string; onRegen: () => void }) {
  const { copied, copy } = useCopy();
  const label = LABELS[slot.key];
  const size = slot.size ?? 13;

  return (
    <div
      className="field-cell"
      style={{
        gridColumn: slot.wide ? "1 / -1" : undefined,
        minWidth: 0,
        borderRadius: 7,
        /* mesmo truque do .field-value: o realce cresce, o layout não */
        padding: "5px 7px",
        margin: "-5px -7px",
      }}
    >
      <div className="mono-label">{label}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3, minWidth: 0 }}>
        <button
          type="button"
          className="field-value"
          title="Copiar"
          aria-label={`Copiar ${label}`}
          onClick={() => copy(value)}
          style={{ fontSize: size, color: slot.color ?? "var(--color-fg)", lineHeight: size > 15 ? 1.25 : 1.45 }}
        >
          {value}
        </button>

        {copied ? (
          <span
            role="status"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              flexShrink: 0,
              fontSize: 10,
              color: "var(--color-primary)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            <Check size={12} strokeWidth={2.5} />
            copiado
          </span>
        ) : (
          <button
            type="button"
            className="btn-copy-icon field-regen"
            title="Gerar de novo só este campo"
            aria-label={`Gerar de novo ${label}`}
            onClick={onRegen}
            style={{ flexShrink: 0 }}
          >
            <RotateCcw size={13} strokeWidth={2} />
          </button>
        )}
      </div>
    </div>
  );
}

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

  const regen = (key: CompanyField) => {
    if (!company) return;
    const patch = regenField(company, key, { alphanumericCnpj: alphanumeric, tipo });
    if (patch.uf) setUf(patch.uf as UF);
    setCompany({ ...company, ...patch });
  };

  const cells = (slots: Slot[]) =>
    company &&
    slots.map((s) => <FieldCell key={s.key} slot={s} value={company[s.key]} onRegen={() => regen(s.key)} />);

  return (
    <ToolPanel
      path="~/generate/empresa"
      description="gera uma empresa fictícia completa para cadastros de teste"
    >
      <div style={{ maxWidth: 720, width: "100%", margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>

        <div className="gen-actions" style={{ alignItems: "center", flexWrap: "wrap", paddingTop: 12 }}>
          <div style={{ display: "flex", height: 34, border: "1px solid var(--color-line)", borderRadius: 8, overflow: "hidden" }}>
            <button
              type="button"
              aria-pressed={!alphanumeric}
              onClick={() => {
                setAlphanumeric(false);
                generate(false);
              }}
              style={seg(!alphanumeric)}
            >
              CNPJ numérico
            </button>
            <button
              type="button"
              aria-pressed={alphanumeric}
              onClick={() => {
                setAlphanumeric(true);
                generate(true);
              }}
              style={{ ...seg(alphanumeric), borderLeft: "1px solid var(--color-line)" }}
            >
              alfanumérico
            </button>
          </div>

          <Select
            value={tipo}
            onChange={(v) => {
              const next = v as EstabId | "";
              setTipo(next);
              setEstablishmentType(next);
              generate(alphanumeric, uf, next);
            }}
            options={ESTABS.map((e) => ({ value: e.id, label: e.label }))}
            placeholder="Tipo aleatório"
            title="Tipo de estabelecimento (fica salvo para a próxima visita)"
          />
          <Select
            value={uf}
            onChange={(v) => {
              const next = v as UF | "";
              setUf(next);
              generate(alphanumeric, next);
            }}
            options={UFS.map((s) => ({ value: s, label: s }))}
            placeholder="UF aleatória"
            title="UF da Inscrição Estadual, endereço e DDD"
          />

          <PrimaryButton style={{ marginLeft: "auto", padding: "8px 16px" }} onClick={() => generate()}>
            <RotateCcw size={13} style={{ verticalAlign: -2, marginRight: 6 }} />
            Gerar nova empresa
          </PrimaryButton>
        </div>

        {/* altura reservada: sem isso o rodapé sobe e desce entre o primeiro
            render e a primeira empresa gerada. 883 é o teto medido da ficha —
            ela varia só uns 10px conforme o CNAE e a razão social quebram linha */}
        <div style={{ minHeight: 883 }}>
          {company && (
            <div style={{ border: "1px solid var(--color-border)", borderRadius: 10, padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="grid-2col">{cells(DESTAQUE)}</div>

              <div style={{ height: 1, background: "var(--color-border)" }} />

              <div className="grid-2col" style={{ gap: "13px 20px" }}>{cells(FICHA)}</div>

              <div style={{ height: 1, background: "var(--color-border)" }} />

              <div className="gen-actions">
                <CopyButton label="Copiar tudo" text={companyToText(company)} />
                <CopyButton label="Copiar JSON" icon={Braces} text={companyToJSON(company)} />
              </div>
            </div>
          )}
        </div>

        <p className="gen-footnote" style={{ margin: "0 auto" }}>
          todos os dados são fictícios, use apenas em ambientes de teste.
        </p>
      </div>
    </ToolPanel>
  );
}
