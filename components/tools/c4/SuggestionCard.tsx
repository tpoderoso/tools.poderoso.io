"use client";

import { useState } from "react";
import {
  addElement,
  addRelation,
  ancestorsOf,
  byId,
  dismiss,
  updateElement,
  updateRelation,
  type C4Model,
} from "@/lib/tools/c4/model";
import type { Suggestion } from "@/lib/tools/c4/suggest";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { Select } from "@/components/ui/Select";
import { ElementForm, type ElementField } from "./ElementForm";
import styles from "./c4.module.css";

interface Props {
  model: C4Model;
  suggestion: Suggestion | undefined;
  onModel: (fn: (m: C4Model) => C4Model) => void;
}

export function SuggestionCard({ model, suggestion, onModel }: Props) {
  if (!suggestion) {
    return (
      <div className={styles.card} key="done">
        <p className={styles.question}>Modelo completo.</p>
        <p className={styles.hint}>Use a árvore abaixo para adicionar o que quiser.</p>
      </div>
    );
  }

  const a = suggestion.action;

  return (
    <div className={styles.card} key={suggestion.id}>
      <p className={styles.question}>{suggestion.question}</p>

      {a.type === "add" && (
        <ElementForm
          key={suggestion.id}
          autoFocus
          submitLabel="adicionar"
          fields={fieldsForAdd(a.kind, a.external)}
          onSubmit={(v) =>
            onModel((m) =>
              addElement(m, {
                kind: a.kind,
                name: v.name,
                description: v.description,
                technology: v.technology || undefined,
                external: a.external ?? v.external,
                parent: a.parent,
              }),
            )
          }
        />
      )}

      {a.type === "edit" && (
        <ElementForm
          key={suggestion.id}
          autoFocus
          submitLabel="salvar"
          fields={[a.field]}
          initial={{
            description: byId(model, a.elementId)?.description ?? "",
            technology: byId(model, a.elementId)?.technology ?? "",
          }}
          onSubmit={(v) =>
            onModel((m) =>
              updateElement(m, a.elementId, a.field === "technology" ? { technology: v.technology } : { description: v.description }),
            )
          }
        />
      )}

      {a.type === "relate" && <RelateForm key={suggestion.id} model={model} fromId={a.elementId} onModel={onModel} />}

      {a.type === "editRelation" && (
        <LabelForm
          key={suggestion.id}
          submitLabel="salvar"
          onSubmit={(label) => onModel((m) => updateRelation(m, a.relationId, { label }))}
        />
      )}

      <button
        type="button"
        className={styles.dismiss}
        onClick={() => onModel((m) => dismiss(m, suggestion.id))}
      >
        tá certo assim
      </button>
    </div>
  );
}

function fieldsForAdd(kind: string, external: boolean | undefined): ElementField[] {
  if (kind === "container" || kind === "component") return ["name", "description", "technology"];
  // a pergunta de abertura já sabe que o sistema é seu, então não pergunta de novo
  if (kind === "system" && external === undefined) return ["name", "description", "external"];
  return ["name", "description"];
}

function LabelForm({ submitLabel, onSubmit }: { submitLabel: string; onSubmit: (label: string) => void }) {
  const [label, setLabel] = useState("");
  return (
    <form
      className={styles.form}
      onSubmit={(e) => {
        e.preventDefault();
        if (!label.trim()) return;
        onSubmit(label.trim());
        setLabel("");
      }}
    >
      <label className={styles.field}>
        <span className="mono-label">o que trafega</span>
        <input
          className={styles.input}
          autoFocus
          value={label}
          placeholder="faz pedidos, lê dados de"
          onChange={(e) => setLabel(e.target.value)}
        />
      </label>
      <PrimaryButton type="submit" disabled={!label.trim()} style={{ alignSelf: "flex-start" }}>
        {submitLabel}
      </PrimaryButton>
    </form>
  );
}

/**
 * Ligar um elemento a outro. Ancestrais e descendentes ficam fora da lista
 * porque `addRelation` recusa esses casos: um componente não "conversa" com o
 * container que o contém, ele faz parte dele.
 */
function RelateForm({
  model,
  fromId,
  onModel,
}: {
  model: C4Model;
  fromId: string;
  onModel: (fn: (m: C4Model) => C4Model) => void;
}) {
  const [to, setTo] = useState("");
  const [label, setLabel] = useState("");

  const blocked = new Set(ancestorsOf(model, fromId));
  const options = model.elements.filter(
    (e) => e.id !== fromId && !blocked.has(e.id) && !ancestorsOf(model, e.id).includes(fromId),
  );

  return (
    <form
      className={styles.form}
      onSubmit={(e) => {
        e.preventDefault();
        if (!to || !label.trim()) return;
        onModel((m) => addRelation(m, { from: fromId, to, label: label.trim() }));
        setTo("");
        setLabel("");
      }}
    >
      <div className={styles.field}>
        <span className="mono-label">conversa com</span>
        <Select
          value={to}
          onChange={setTo}
          placeholder="escolha um"
          options={options.map((e) => ({ value: e.id, label: e.name }))}
        />
      </div>
      <label className={styles.field}>
        <span className="mono-label">para</span>
        <input
          className={styles.input}
          value={label}
          placeholder="consultar saldo"
          onChange={(e) => setLabel(e.target.value)}
        />
      </label>
      <PrimaryButton type="submit" disabled={!to || !label.trim()} style={{ alignSelf: "flex-start" }}>
        ligar
      </PrimaryButton>
    </form>
  );
}
