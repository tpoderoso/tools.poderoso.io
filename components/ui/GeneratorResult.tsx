import type { ReactNode } from "react";
import { RotateCcw } from "lucide-react";
import { CenteredColumn } from "./CenteredColumn";
import { PrimaryButton } from "./PrimaryButton";
import { CopyButton } from "./CopyButton";

interface GeneratorResultProps {
  label: string;
  value: string;
  valueSize: string;
  valueColor: string;
  valueLetterSpacing?: string;
  regenerateLabel: string;
  onRegenerate: () => void;
  footnote?: ReactNode;
}

/**
 * Shared result layout for "generator" tools (CPF, CNPJ, UUID, senha, lorem): big centered value,
 * a regenerate button, a copy button, and an optional footnote.
 */
export function GeneratorResult({
  label,
  value,
  valueSize,
  valueColor,
  valueLetterSpacing = "0.1em",
  regenerateLabel,
  onRegenerate,
  footnote,
}: GeneratorResultProps) {
  return (
    <CenteredColumn>
      <div className="mono-label mono-label--wide">{label}</div>
      <div
        style={{
          fontWeight: 500,
          fontSize: valueSize,
          color: valueColor,
          letterSpacing: valueLetterSpacing,
          maxWidth: "100%",
          overflowWrap: "anywhere",
          textAlign: "center",
        }}
      >
        {value}
      </div>
      <div className="gen-actions">
        <PrimaryButton style={{ padding: "11px 22px" }} onClick={onRegenerate}>
          <RotateCcw size={13} style={{ verticalAlign: -2, marginRight: 6 }} />
          {regenerateLabel}
        </PrimaryButton>
        <CopyButton variant="text" text={value} />
      </div>
      {footnote && <p className="gen-footnote">{footnote}</p>}
    </CenteredColumn>
  );
}
