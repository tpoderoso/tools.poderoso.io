"use client";

import { AppWindow, Box, Container, Database, Folder, Layers, Package, Pencil, Plus, Smartphone, Terminal, User, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { childrenOf, type C4Element, type C4Model } from "@/lib/tools/c4/model";
import { shapeFor, type Shape } from "@/lib/tools/c4/shape";
import styles from "./c4.module.css";

/** Ícone por forma. "system" não é uma forma — o sistema usa Box, tratado
 *  fora desta tabela, porque shapeFor sempre devolve "default" para ele. */
const ICON: Record<Shape, LucideIcon> = {
  person: User,
  default: Container,
  database: Database,
  queue: Layers,
  browser: AppWindow,
  mobile: Smartphone,
  cli: Terminal,
  folder: Folder,
  blob: Package,
};

interface Props {
  model: C4Model;
  selected: string | null;
  onSelect: (id: string) => void;
  onEdit: (id: string) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
}

export function ModelTree({ model, selected, onSelect, onEdit, onAdd, onRemove }: Props) {
  const roots = model.elements.filter((e) => !e.parent);

  return (
    <div className={styles.tree}>
      <header className={styles.treeHead}>
        <span className="mono-label mono-label--wide">{"// modelo"}</span>
        <span className={styles.treeCount}>{model.elements.length}</span>
        <span className={styles.treeSpacer} />
        <button type="button" className={styles.treeAddBtn} aria-label="adicionar elemento" title="adicionar elemento" onClick={onAdd}>
          <Plus size={13} />
        </button>
      </header>

      {roots.length === 0 && <p className={styles.hint}>Nada ainda. Use o + para adicionar.</p>}

      <ul className={styles.treeList}>
        {roots.map((e) => (
          <Node key={e.id} model={model} el={e} selected={selected} onSelect={onSelect} onEdit={onEdit} onRemove={onRemove} />
        ))}
      </ul>
    </div>
  );
}

function Node({
  model,
  el,
  selected,
  onSelect,
  onEdit,
  onRemove,
}: {
  model: C4Model;
  el: C4Element;
  selected: string | null;
  onSelect: (id: string) => void;
  onEdit: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const kids = childrenOf(model, el.id);
  // sistema e pessoa usam ícone por kind; o resto usa a forma deduzida
  const Icon = el.kind === "system" ? Box : ICON[shapeFor(el)];
  const meta = el.external ? (el.kind === "person" ? "externa" : "externo") : (el.technology ?? "");

  return (
    <>
      <li className={selected === el.id ? `${styles.treeItem} ${styles.treeItemOn}` : styles.treeItem}>
        <button type="button" className={styles.treeName} onClick={() => onSelect(el.id)}>
          <Icon size={13} style={{ flex: "0 0 auto" }} />
          <span>{el.name}</span>
        </button>
        <span className={styles.treeMeta}>{meta}</span>
        <span className={styles.treeSpacer} />
        <button type="button" className={styles.treeDelBtn} aria-label={`editar ${el.name}`} title={`editar ${el.name}`} onClick={() => onEdit(el.id)}>
          <Pencil size={12} />
        </button>
        <button type="button" className={styles.treeDelBtn} aria-label={`remover ${el.name}`} title={`remover ${el.name}`} onClick={() => onRemove(el.id)}>
          <X size={13} />
        </button>
      </li>
      {kids.length > 0 && (
        <li>
          <ul className={`${styles.treeList} ${styles.treeNest}`}>
            {kids.map((k) => (
              <Node key={k.id} model={model} el={k} selected={selected} onSelect={onSelect} onEdit={onEdit} onRemove={onRemove} />
            ))}
          </ul>
        </li>
      )}
    </>
  );
}
