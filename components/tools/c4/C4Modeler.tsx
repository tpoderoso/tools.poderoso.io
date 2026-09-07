"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ToolPanel } from "@/components/ui/ToolPanel";
import { Select } from "@/components/ui/Select";
import { exampleModel } from "@/lib/tools/c4/example";
import { byId, childrenOf, emptyModel, setPosition, type C4Model, type ViewId } from "@/lib/tools/c4/model";
import { availableViews, buildView, parseViewId } from "@/lib/tools/c4/views";
import { autoLayout } from "@/lib/tools/c4/layout";
import { suggest } from "@/lib/tools/c4/suggest";
import { toMermaidC4, toStructurizrDsl } from "@/lib/tools/c4/export";
import { downloadBlob, svgToPngBlob } from "@/lib/tools/mermaidExport";
import { C4Canvas } from "./C4Canvas";
import { ModelTree } from "./ModelTree";
import { SuggestionCard } from "./SuggestionCard";
import styles from "./c4.module.css";

const STORAGE_KEY = "tools.poderoso.io/c4";

/**
 * O modelo salvo é reconstruído com o que veio do JSON, mas só depois de checar
 * a versão: é um arquivo que a pessoa pode ter editado à mão ou trazido de outro
 * lugar, então é fronteira de confiança e não dá para confiar no formato.
 */
function parseModel(text: string): C4Model | null {
  try {
    const raw = JSON.parse(text) as Partial<C4Model>;
    if (raw?.version !== 1 || !Array.isArray(raw.elements) || !Array.isArray(raw.relations)) return null;
    return {
      version: 1,
      name: typeof raw.name === "string" ? raw.name : "Modelo",
      elements: raw.elements,
      relations: raw.relations,
      layout: raw.layout ?? {},
      dismissed: Array.isArray(raw.dismissed) ? raw.dismissed : [],
    };
  } catch {
    return null;
  }
}

/** Troca cada var(--x) pelo valor computado. Sem isso a imagem exportada sai sem
 *  cor, porque fora do documento não existe quem defina as variáveis.
 *  O valor precisa ser escapado como XML antes de entrar no atributo `style="..."`:
 *  `--font-mono` resolve para uma pilha de fontes entre aspas, e sem escapar o "&"
 *  primeiro as próprias entidades inseridas (&quot; etc.) seriam escapadas de novo. */
function inlineCssVars(svg: string): string {
  const cs = getComputedStyle(document.documentElement);
  return svg.replace(/var\((--[a-z0-9-]+)\)/gi, (_, name: string) => {
    const value = cs.getPropertyValue(name).trim() || "#f8f8f2";
    return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  });
}

export function C4Modeler() {
  const [model, setModel] = useState(emptyModel);
  const [viewId, setViewId] = useState<ViewId>("landscape");
  const svgRef = useRef<SVGSVGElement>(null);

  // carrega uma vez, no cliente: localStorage não existe no servidor
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? parseModel(saved) : null;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (parsed) setModel(parsed);
  }, []);

  // autosave com atraso, para não escrever a cada tecla digitada no formulário
  useEffect(() => {
    const id = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(model));
      } catch {
        // cota cheia ou navegador em modo restrito: não vale derrubar a ferramenta
      }
    }, 400);
    return () => clearTimeout(id);
  }, [model]);

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

  const serializedSvg = () => {
    const el = svgRef.current;
    if (!el) return null;
    return inlineCssVars(new XMLSerializer().serializeToString(el));
  };

  const exportSvg = () => {
    const svg = serializedSvg();
    if (svg) downloadBlob(new Blob([svg], { type: "image/svg+xml" }), `c4-${active}.svg`);
  };

  const exportPng = async () => {
    const svg = serializedSvg();
    if (!svg) return;
    const bg = getComputedStyle(document.documentElement).getPropertyValue("--color-bg-alt").trim();
    downloadBlob(await svgToPngBlob(svg, layout.width, layout.height, bg), `c4-${active}.png`);
  };

  const exportText = (text: string, name: string, type: string) =>
    downloadBlob(new Blob([text], { type }), name);

  const openJson = (file: File) => {
    file.text().then((text) => {
      const parsed = parseModel(text);
      if (parsed) setModel(parsed);
      else alert("Esse arquivo não é um modelo C4 desta ferramenta.");
    });
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
          <div className={styles.exportGroup}>
            <button type="button" className={styles.ghost} onClick={exportSvg}>svg</button>
            <button type="button" className={styles.ghost} onClick={exportPng}>png</button>
            <button
              type="button"
              className={styles.ghost}
              onClick={() => exportText(toStructurizrDsl(model), `${model.name}.dsl`, "text/plain")}
            >
              structurizr
            </button>
            <button
              type="button"
              className={styles.ghost}
              onClick={() => exportText(toMermaidC4(model, active), `c4-${active}.mmd`, "text/plain")}
            >
              mermaid
            </button>
            <button
              type="button"
              className={styles.ghost}
              onClick={() => exportText(JSON.stringify(model, null, 2), `${model.name}.c4.json`, "application/json")}
            >
              salvar
            </button>
            <label className={styles.ghost} style={{ cursor: "pointer" }}>
              abrir
              <input
                type="file"
                accept="application/json,.json"
                style={{ display: "none" }}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) openJson(f);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
        </div>
        <div className={styles.split}>
          <aside className={styles.panel}>
            <SuggestionCard model={model} suggestion={pending[0]} onModel={onModel} />
            <ModelTree model={model} onModel={onModel} onFocus={focusOn} />
          </aside>
          <C4Canvas view={view} model={model} layout={layout} onOpen={open} onMove={move} svgRef={svgRef} />
        </div>
      </div>
    </ToolPanel>
  );
}
