"use client";

import { useState } from "react";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { Select } from "@/components/ui/Select";
import { SHAPE_OPTIONS, shapeFor, type Shape } from "@/lib/tools/c4/shape";
import styles from "./c4.module.css";

export interface ElementFormValues {
  name: string;
  description: string;
  technology: string;
  external: boolean;
  shape: Shape;
}

export type ElementField = keyof ElementFormValues;

const LABELS: Record<ElementField, string> = {
  name: "nome",
  description: "o que faz",
  technology: "tecnologia",
  external: "é de fora da sua empresa",
  shape: "forma no diagrama",
};

const PLACEHOLDERS: Record<ElementField, string> = {
  name: "Checkout",
  description: "carrinho e pagamento",
  technology: "Node, React, Postgres",
  external: "",
  shape: "",
};

interface Props {
  fields: ElementField[];
  initial?: Partial<ElementFormValues>;
  submitLabel: string;
  autoFocus?: boolean;
  /** Foca este campo específico em vez do primeiro da lista — usado quando a
   *  pendência resolvida aponta para um campo puntual (ex.: tecnologia). */
  autoFocusField?: ElementField;
  onSubmit: (v: ElementFormValues) => void;
}

/** Formulário genérico de elemento. Quem chama escolhe os campos, porque a
 *  pergunta do card às vezes quer só um deles (por exemplo, só a tecnologia). */
export function ElementForm({ fields, initial, submitLabel, autoFocus, autoFocusField, onSubmit }: Props) {
  const blank: ElementFormValues = {
    name: initial?.name ?? "",
    description: initial?.description ?? "",
    technology: initial?.technology ?? "",
    external: initial?.external ?? false,
    shape: initial?.shape ?? "default",
  };
  const [v, setV] = useState(blank);
  /** Enquanto a pessoa não escolher forma à mão, a forma acompanha a
   *  tecnologia. No instante em que ela escolhe, o palpite para de mandar. */
  const [shapeTouched, setShapeTouched] = useState(initial?.shape !== undefined);
  const guessed = shapeTouched ? v.shape : shapeFor({ kind: "container", technology: v.technology });

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
          shape: guessed,
        });
        setV({ name: "", description: "", technology: "", external: false, shape: "default" });
        setShapeTouched(false);
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
        ) : f === "shape" ? (
          <div key={f} className={styles.field}>
            <span className="mono-label">{LABELS[f]}</span>
            <Select
              value={guessed}
              onChange={(s) => {
                setShapeTouched(true);
                setV({ ...v, shape: s as Shape });
              }}
              options={SHAPE_OPTIONS}
              title="forma no diagrama"
            />
          </div>
        ) : (
          <label key={f} className={styles.field}>
            <span className="mono-label">{LABELS[f]}</span>
            <input
              className={styles.input}
              autoFocus={autoFocusField ? f === autoFocusField : autoFocus && i === 0}
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
