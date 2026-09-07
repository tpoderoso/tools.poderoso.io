"use client";

import { useState } from "react";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import styles from "./c4.module.css";

export interface ElementFormValues {
  name: string;
  description: string;
  technology: string;
  external: boolean;
}

export type ElementField = keyof ElementFormValues;

const LABELS: Record<ElementField, string> = {
  name: "nome",
  description: "o que faz",
  technology: "tecnologia",
  external: "é de fora da sua empresa",
};

const PLACEHOLDERS: Record<ElementField, string> = {
  name: "Checkout",
  description: "carrinho e pagamento",
  technology: "Node, React, Postgres",
  external: "",
};

interface Props {
  fields: ElementField[];
  initial?: Partial<ElementFormValues>;
  submitLabel: string;
  autoFocus?: boolean;
  onSubmit: (v: ElementFormValues) => void;
}

/** Formulário genérico de elemento. Quem chama escolhe os campos, porque a
 *  pergunta do card às vezes quer só um deles (por exemplo, só a tecnologia). */
export function ElementForm({ fields, initial, submitLabel, autoFocus, onSubmit }: Props) {
  const blank: ElementFormValues = {
    name: initial?.name ?? "",
    description: initial?.description ?? "",
    technology: initial?.technology ?? "",
    external: initial?.external ?? false,
  };
  const [v, setV] = useState(blank);

  const canSubmit = !fields.includes("name") || v.name.trim().length > 0;

  return (
    <form
      className={styles.form}
      onSubmit={(e) => {
        e.preventDefault();
        if (!canSubmit) return;
        onSubmit({
          name: v.name.trim(),
          description: v.description.trim(),
          technology: v.technology.trim(),
          external: v.external,
        });
        setV({ name: "", description: "", technology: "", external: false });
      }}
    >
      {fields.map((f, i) =>
        f === "external" ? (
          <label key={f} className={styles.check}>
            <input
              type="checkbox"
              checked={v.external}
              onChange={(e) => setV({ ...v, external: e.target.checked })}
            />
            <span>{LABELS[f]}</span>
          </label>
        ) : (
          <label key={f} className={styles.field}>
            <span className="mono-label">{LABELS[f]}</span>
            <input
              className={styles.input}
              autoFocus={autoFocus && i === 0}
              value={v[f]}
              placeholder={PLACEHOLDERS[f]}
              onChange={(e) => setV({ ...v, [f]: e.target.value })}
            />
          </label>
        ),
      )}
      <PrimaryButton type="submit" disabled={!canSubmit} style={{ alignSelf: "flex-start" }}>
        {submitLabel}
      </PrimaryButton>
    </form>
  );
}
