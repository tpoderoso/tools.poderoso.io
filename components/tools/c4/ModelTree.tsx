"use client";

import { Fragment, useState } from "react";
import { Plus, X } from "lucide-react";
import { addElement, childrenOf, removeElement, type C4Model, type ElementKind } from "@/lib/tools/c4/model";
import { ElementForm, type ElementField, type ElementFormValues } from "./ElementForm";
import styles from "./c4.module.css";

interface Props {
  model: C4Model;
  onModel: (fn: (m: C4Model) => C4Model) => void;
  /** clicar num item leva o diagrama para a view onde ele aparece */
  onFocus: (id: string) => void;
}

/** Chave do formulário aberto: o tipo a criar mais o pai, quando houver. */
type Adding = { kind: ElementKind; parent?: string } | null;

export function ModelTree({ model, onModel, onFocus }: Props) {
  const [adding, setAdding] = useState<Adding>(null);

  const persons = model.elements.filter((e) => e.kind === "person");
  const systems = model.elements.filter((e) => e.kind === "system");

  const openForm = (kind: ElementKind, parent?: string) =>
    setAdding((a) => (a?.kind === kind && a?.parent === parent ? null : { kind, parent }));

  const submit = (kind: ElementKind, parent: string | undefined, v: ElementFormValues) => {
    onModel((m) =>
      addElement(m, {
        kind,
        name: v.name,
        description: v.description,
        technology: v.technology || undefined,
        external: v.external,
        parent,
        tags: v.shape === "default" ? undefined : [v.shape],
      }),
    );
    setAdding(null);
  };

  const form = (kind: ElementKind, parent?: string) =>
    adding?.kind === kind && adding?.parent === parent ? (
      <ElementForm
        autoFocus
        submitLabel="adicionar"
        fields={fieldsFor(kind)}
        onSubmit={(v) => submit(kind, parent, v)}
      />
    ) : null;

  const item = (id: string, name: string, meta: string, strong = false) => (
    <li key={id} className={styles.treeItem}>
      <button
        type="button"
        className={strong ? `${styles.treeName} ${styles.treeNameStrong}` : styles.treeName}
        onClick={() => onFocus(id)}
      >
        {name}
      </button>
      <span className={styles.treeMeta}>{meta}</span>
      <span className={styles.treeSpacer} />
      <button
        type="button"
        className={styles.treeDelBtn}
        aria-label={`remover ${name}`}
        title={`remover ${name}`}
        onClick={() => onModel((m) => removeElement(m, id))}
      >
        <X size={13} />
      </button>
    </li>
  );

  return (
    <div className={styles.tree}>
      <Section title="pessoas" count={persons.length} onAdd={() => openForm("person")}>
        <ul className={styles.treeList}>
          {persons.map((p) => item(p.id, p.name, p.external ? "externa" : "", true))}
        </ul>
        {form("person")}
      </Section>

      <Section title="sistemas" count={systems.length} onAdd={() => openForm("system")}>
        <ul className={styles.treeList}>
          {systems.map((s) => (
            <Fragment key={s.id}>
              {item(s.id, s.name, s.external ? "externo" : "", true)}
              {!s.external && (
                <li>
                  <div className={styles.treeNest}>
                    <ul className={styles.treeList}>
                      {childrenOf(model, s.id).map((c) => (
                        <Fragment key={c.id}>
                          {item(c.id, c.name, c.technology ?? "")}
                          <li>
                            <div className={styles.treeNest}>
                              <ul className={styles.treeList}>
                                {childrenOf(model, c.id).map((k) => item(k.id, k.name, k.technology ?? ""))}
                              </ul>
                              <button
                                type="button"
                                className={styles.treeAddChild}
                                onClick={() => openForm("component", c.id)}
                              >
                                <Plus size={12} />
                                componente
                              </button>
                              {form("component", c.id)}
                            </div>
                          </li>
                        </Fragment>
                      ))}
                    </ul>
                    <button
                      type="button"
                      className={styles.treeAddChild}
                      onClick={() => openForm("container", s.id)}
                    >
                      <Plus size={12} />
                      container
                    </button>
                    {form("container", s.id)}
                  </div>
                </li>
              )}
            </Fragment>
          ))}
        </ul>
        {form("system")}
      </Section>
    </div>
  );
}

function fieldsFor(kind: ElementKind): ElementField[] {
  if (kind === "container" || kind === "component") return ["name", "description", "technology", "shape"];
  if (kind === "system" || kind === "person") return ["name", "description", "external"];
  return ["name", "description"];
}

function Section({
  title,
  count,
  onAdd,
  children,
}: {
  title: string;
  count: number;
  onAdd: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className={styles.treeSection}>
      <header className={styles.treeHead}>
        <span className="mono-label mono-label--wide">{`// ${title}`}</span>
        <span className={styles.treeCount}>{count}</span>
        <span className={styles.treeSpacer} />
        <button type="button" className={styles.treeAddBtn} aria-label={`adicionar ${title}`} title={`adicionar ${title}`} onClick={onAdd}>
          <Plus size={13} />
        </button>
      </header>
      {children}
    </section>
  );
}
