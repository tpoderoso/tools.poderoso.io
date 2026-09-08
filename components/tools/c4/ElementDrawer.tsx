"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import {
  addElement,
  addRelation,
  ancestorsOf,
  byId,
  dismiss,
  removeRelation,
  updateElement,
  type C4Model,
  type ElementKind,
} from "@/lib/tools/c4/model";
import { suggest, type Suggestion } from "@/lib/tools/c4/suggest";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { Select } from "@/components/ui/Select";
import { ElementForm, type ElementField, type ElementFormValues } from "./ElementForm";
import styles from "./c4.module.css";

export type DrawerState =
  | { mode: "create"; kind?: ElementKind; parent?: string; external?: boolean }
  | { mode: "edit"; id: string; focusField?: ElementField }
  | { mode: "issues" };

const KIND_LABEL: Record<ElementKind, string> = {
  person: "pessoa",
  system: "sistema",
  container: "container",
  component: "componente",
};

function fieldsFor(kind: ElementKind): ElementField[] {
  if (kind === "container" || kind === "component") return ["name", "description", "technology", "shape"];
  return ["name", "description", "external"];
}

interface Props {
  model: C4Model;
  state: DrawerState;
  onModel: (fn: (m: C4Model) => C4Model) => void;
  onOpenDrawer: (s: DrawerState) => void;
  onClose: () => void;
}

export function ElementDrawer({ model, state, onModel, onOpenDrawer, onClose }: Props) {
  // Escape fecha de qualquer modo. Registrado no document porque o foco pode
  // estar num input dentro do drawer ou no backdrop.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      <div className={styles.drawerBackdrop} onClick={onClose} />
      <aside className={styles.drawer} role="dialog" aria-label="cadastro de elemento">
        {state.mode === "create" && <CreateFlow model={model} state={state} onModel={onModel} onClose={onClose} />}
        {state.mode === "edit" && <EditForm model={model} state={state} onModel={onModel} onClose={onClose} />}
        {state.mode === "issues" && <IssueList model={model} onModel={onModel} onOpen={onOpenDrawer} onClose={onClose} />}
      </aside>
    </>
  );
}

function Head({ title, step, onClose }: { title: string; step?: string; onClose: () => void }) {
  return (
    <header className={styles.drawerHead}>
      <span className={styles.drawerTitle}>{title}</span>
      {step && <span className={styles.drawerStep}>{step}</span>}
      <span style={{ flex: "1 1 0" }} />
      <button type="button" className={styles.treeDelBtn} aria-label="fechar" title="fechar" onClick={onClose}>
        <X size={14} />
      </button>
    </header>
  );
}

/**
 * Cadastro em passos. O elemento só nasce no "concluir": desistir no meio
 * (backdrop, X, Escape) não deixa meio-elemento no modelo.
 */
function CreateFlow({
  model,
  state,
  onModel,
  onClose,
}: {
  model: C4Model;
  state: Extract<DrawerState, { mode: "create" }>;
  onModel: (fn: (m: C4Model) => C4Model) => void;
  onClose: () => void;
}) {
  const [kind, setKind] = useState<ElementKind | undefined>(state.kind);
  const [step, setStep] = useState(state.kind ? 2 : 1);
  const [values, setValues] = useState<ElementFormValues | null>(null);
  const [to, setTo] = useState("");
  const [label, setLabel] = useState("");

  // quem já pode ser destino de uma relação com o que está sendo criado
  const targets = model.elements.filter((e) => !state.parent || !ancestorsOf(model, e.id).includes(state.parent));
  const lastStep = targets.length ? 4 : 3;

  // Recebe o valor explicitamente em vez de ler `values` do escopo: `setValues`
  // é assíncrono, então no mesmo tick de um onSubmit do último passo `values`
  // ainda teria o conteúdo de ANTES desta submissão (React não re-renderizou).
  // Ler o state aqui perderia o technology/shape/external do último passo.
  const finish = (v: ElementFormValues) => {
    if (!kind || !v.name.trim()) return;
    onModel((m) => {
      const next = addElement(m, {
        kind,
        name: v.name,
        description: v.description,
        technology: v.technology || undefined,
        external: state.external ?? v.external,
        parent: state.parent,
        tags: [v.shape],
      });
      const created = next.elements[next.elements.length - 1];
      if (!to || !label.trim()) return next;
      try {
        return addRelation(next, { from: created.id, to, label: label.trim() });
      } catch {
        return next; // alvo virou inválido no meio do caminho: cria só o elemento
      }
    });
    onClose();
  };

  return (
    <>
      <Head
        title={kind ? `novo ${KIND_LABEL[kind]}` : "o que você quer adicionar?"}
        step={`passo ${step} de ${lastStep}`}
        onClose={onClose}
      />
      <div className={styles.progressTrack}>
        <div className={styles.progressFill} style={{ width: `${(step / lastStep) * 100}%` }} />
      </div>

      <div className={styles.drawerBody}>
        {step === 1 && (
          <div className={styles.kindGrid}>
            {(["person", "system", "container", "component"] as ElementKind[]).map((k) => (
              <PrimaryButton
                key={k}
                onClick={() => {
                  setKind(k);
                  setStep(2);
                }}
              >
                {KIND_LABEL[k]}
              </PrimaryButton>
            ))}
          </div>
        )}

        {step >= 2 && step <= 3 && kind && (
          <ElementForm
            key={`${kind}:${step}`}
            autoFocus
            submitLabel={step < lastStep ? "próximo" : "concluir"}
            fields={step === 2 ? ["name", "description"] : fieldsFor(kind).slice(2)}
            initial={values ?? undefined}
            onSubmit={(v) => {
              const merged = { ...(values ?? v), ...v };
              setValues(merged);
              if (step < lastStep) setStep(step + 1);
              else finish(merged);
            }}
          />
        )}

        {step === 4 && (
          <>
            <div className={styles.field}>
              <span className="mono-label">conversa com</span>
              <Select
                value={to}
                onChange={setTo}
                placeholder="ninguém por enquanto"
                options={targets.map((e) => ({ value: e.id, label: e.name }))}
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
          </>
        )}
      </div>

      <footer className={styles.drawerFoot}>
        {step > (state.kind ? 2 : 1) && (
          <button type="button" className="mmd-tool-btn" style={{ padding: "0 10px", fontSize: 12 }} onClick={() => setStep(step - 1)}>
            voltar
          </button>
        )}
        <span style={{ flex: "1 1 0" }} />
        {step === 4 && (
          <PrimaryButton disabled={!values?.name.trim()} onClick={() => values && finish(values)}>
            concluir
          </PrimaryButton>
        )}
      </footer>
    </>
  );
}

/** Edição: sem passos, tudo numa tela, mais as relações do elemento. */
function EditForm({
  model,
  state,
  onModel,
  onClose,
}: {
  model: C4Model;
  state: Extract<DrawerState, { mode: "edit" }>;
  onModel: (fn: (m: C4Model) => C4Model) => void;
  onClose: () => void;
}) {
  const el = byId(model, state.id);
  const [to, setTo] = useState("");
  const [label, setLabel] = useState("");

  // o elemento pode ter sido removido pela árvore enquanto o drawer estava aberto
  useEffect(() => {
    if (!el) onClose();
  }, [el, onClose]);
  if (!el) return null;

  const relations = model.relations.filter((r) => r.from === el.id || r.to === el.id);
  const blocked = new Set(ancestorsOf(model, el.id));
  const targets = model.elements.filter(
    (e) => e.id !== el.id && !blocked.has(e.id) && !ancestorsOf(model, e.id).includes(el.id),
  );

  return (
    <>
      <Head title={`editar ${el.name}`} onClose={onClose} />
      <div className={styles.drawerBody}>
        <ElementForm
          key={el.id}
          autoFocus
          autoFocusField={state.focusField}
          submitLabel="salvar"
          fields={fieldsFor(el.kind)}
          initial={{
            name: el.name,
            description: el.description,
            technology: el.technology ?? "",
            external: el.external,
            shape: el.tags?.[0] as ElementFormValues["shape"] | undefined,
          }}
          onSubmit={(v) => {
            onModel((m) =>
              updateElement(m, el.id, {
                name: v.name,
                description: v.description,
                technology: v.technology || undefined,
                external: v.external,
                tags: [v.shape],
              }),
            );
            onClose();
          }}
        />

        <span className="mono-label mono-label--wide">{"// ligações"}</span>
        {relations.map((r) => {
          const other = byId(model, r.from === el.id ? r.to : r.from);
          return (
            <div key={r.id} className={styles.relationRow}>
              <span>{`${r.from === el.id ? "→" : "←"} ${other?.name ?? "?"}: ${r.label || "(sem rótulo)"}`}</span>
              <span style={{ flex: "1 1 0" }} />
              <button
                type="button"
                className={styles.treeDelBtn}
                aria-label={`remover ligação com ${other?.name ?? "?"}`}
                onClick={() => onModel((m) => removeRelation(m, r.id))}
              >
                <X size={12} />
              </button>
            </div>
          );
        })}

        <div className={styles.field}>
          <span className="mono-label">nova ligação com</span>
          <Select
            value={to}
            onChange={setTo}
            placeholder="escolha um"
            options={targets.map((e) => ({ value: e.id, label: e.name }))}
          />
        </div>
        <label className={styles.field}>
          <span className="mono-label">para</span>
          <input className={styles.input} value={label} placeholder="consultar saldo" onChange={(e) => setLabel(e.target.value)} />
        </label>
        <PrimaryButton
          disabled={!to || !label.trim()}
          style={{ alignSelf: "flex-start" }}
          onClick={() => {
            onModel((m) => addRelation(m, { from: el.id, to, label: label.trim() }));
            setTo("");
            setLabel("");
          }}
        >
          ligar
        </PrimaryButton>
      </div>
    </>
  );
}

/** Lista de pendências: cada sugestão do motor (Task 10) vira uma linha com
 *  frase declarativa (`issue`, não `question`) e duas ações. */
function IssueList({
  model,
  onModel,
  onOpen,
  onClose,
}: {
  model: C4Model;
  onModel: (fn: (m: C4Model) => C4Model) => void;
  onOpen: (s: DrawerState) => void;
  onClose: () => void;
}) {
  const items = suggest(model);

  /** Cada tipo de sugestão sabe em que tela do drawer ela se resolve. */
  const resolve = (s: Suggestion) => {
    const a = s.action;
    if (a.type === "add") onOpen({ mode: "create", kind: a.kind, parent: a.parent, external: a.external });
    else if (a.type === "edit") onOpen({ mode: "edit", id: a.elementId, focusField: a.field });
    else if (a.type === "relate") onOpen({ mode: "edit", id: a.elementId });
    else onOpen({ mode: "edit", id: model.relations.find((r) => r.id === a.relationId)?.from ?? "" });
  };

  return (
    <>
      <Head title="pendências" step={`${items.length}`} onClose={onClose} />
      <div className={styles.drawerBody}>
        {items.length === 0 && <p className={styles.hint}>Nada pendente. O modelo está completo.</p>}
        {items.map((s) => (
          <div key={s.id} className={styles.issueRow}>
            <span style={{ minWidth: 0 }}>{s.issue}</span>
            <span style={{ flex: "1 1 0" }} />
            <button type="button" className="mmd-tool-btn" style={{ padding: "0 8px", fontSize: 11 }} onClick={() => resolve(s)}>
              resolver
            </button>
            <button
              type="button"
              className="mmd-tool-btn"
              style={{ padding: "0 8px", fontSize: 11 }}
              onClick={() => onModel((m) => dismiss(m, s.id))}
            >
              ignorar
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
