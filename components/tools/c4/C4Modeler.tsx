"use client";

import { useMemo, useState } from "react";
import { ToolPanel } from "@/components/ui/ToolPanel";
import { Select } from "@/components/ui/Select";
import { exampleModel } from "@/lib/tools/c4/example";
import { byId, childrenOf, emptyModel, setPosition, type C4Model, type ViewId } from "@/lib/tools/c4/model";
import { availableViews, buildView, parseViewId } from "@/lib/tools/c4/views";
import { autoLayout } from "@/lib/tools/c4/layout";
import { suggest } from "@/lib/tools/c4/suggest";
import { C4Canvas } from "./C4Canvas";
import { ModelTree } from "./ModelTree";
import { SuggestionCard } from "./SuggestionCard";
import styles from "./c4.module.css";

export function C4Modeler() {
  const [model, setModel] = useState(emptyModel);
  const [viewId, setViewId] = useState<ViewId>("landscape");

  const views = useMemo(() => availableViews(model), [model]);
  // se a view atual deixou de existir (o elemento em foco sumiu), cai no landscape
  const active: ViewId = views.some((v) => v.id === viewId) ? viewId : "landscape";
  const view = useMemo(() => buildView(model, active), [model, active]);
  const layout = useMemo(() => autoLayout(view, model, model.layout[active] ?? {}), [view, model, active]);

  /**
   * Duplo clique desce um nível: sistema interno abre os containers, container
   * abre os componentes. Só desce se houver filhos, senão o duplo clique não
   * faz nada e a caixa continua sendo uma caixa fechada.
   */
  const open = (id: string) => {
    const el = byId(model, id);
    if (!el || !childrenOf(model, id).length) return;
    if (el.kind === "system" && !el.external) setViewId(`container:${id}`);
    else if (el.kind === "container") setViewId(`component:${id}`);
  };

  const move = (id: string, pos: { x: number; y: number }) => {
    setModel((m) => setPosition(m, active, id, pos));
  };

  const pending = useMemo(() => suggest(model), [model]);
  const onModel = (fn: (m: C4Model) => C4Model) => setModel(fn);

  /** Abre a view em que o elemento aparece: componente vai para a view do
   *  container que o contém, container para a do sistema, o resto fica no Landscape. */
  const focusOn = (id: string) => {
    const el = byId(model, id);
    if (!el) return;
    if (el.kind === "component" && el.parent) setViewId(`component:${el.parent}`);
    else if (el.kind === "container" && el.parent) setViewId(`container:${el.parent}`);
    else setViewId("landscape");
  };

  /** Trilha do nível atual até o Landscape, para voltar. */
  const trail: { id: ViewId; label: string }[] = useMemo(() => {
    const { kind, focus } = parseViewId(active);
    const out: { id: ViewId; label: string }[] = [{ id: "landscape", label: "Landscape" }];
    if (!focus) return out;
    const el = byId(model, focus);
    if (kind === "component" && el?.parent) {
      const sys = byId(model, el.parent);
      if (sys) out.push({ id: `container:${sys.id}`, label: sys.name });
    }
    out.push({ id: active, label: el?.name ?? focus });
    return out;
  }, [active, model]);

  return (
    <ToolPanel path="~/diagram/c4" description="monta o C4 model do seu sistema respondendo perguntas">
      <div className={styles.modeler}>
        <div className={styles.bar}>
          <nav className={styles.trail} aria-label="nível do diagrama">
            {trail.map((step, i) => (
              <span key={step.id}>
                {i > 0 && <span className={styles.trailSep}>{"/"}</span>}
                {step.id === active ? (
                  <span className={styles.trailHere}>{step.label}</span>
                ) : (
                  <button type="button" className={styles.trailLink} onClick={() => setViewId(step.id)}>
                    {step.label}
                  </button>
                )}
              </span>
            ))}
          </nav>
          <Select
            title="nível do diagrama"
            value={active}
            onChange={(v) => setViewId(v as ViewId)}
            options={views.map((v) => ({ value: v.id, label: v.title }))}
          />
          <div style={{ flex: "1 1 0", minWidth: 8 }} />
          <button type="button" className={styles.ghost} onClick={() => setModel(exampleModel())}>
            ver um exemplo
          </button>
        </div>
        <div className={styles.split}>
          <aside className={styles.panel}>
            <SuggestionCard model={model} suggestion={pending[0]} onModel={onModel} />
            <ModelTree model={model} onModel={onModel} onFocus={focusOn} />
          </aside>
          <C4Canvas view={view} model={model} layout={layout} onOpen={open} onMove={move} />
        </div>
      </div>
    </ToolPanel>
  );
}
