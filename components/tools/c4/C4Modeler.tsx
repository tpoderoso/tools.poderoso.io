"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FileCode, FileText, FolderOpen, Image as ImageIcon, Save, Sparkles, Workflow } from "lucide-react";
import { ToolPanel } from "@/components/ui/ToolPanel";
import { Select } from "@/components/ui/Select";
import { toastError } from "@/components/ui/Toaster";
import { exampleModel } from "@/lib/tools/c4/example";
import { byId, childrenOf, clearLayout, emptyModel, removeElement, sanitizeModel, setPosition, type C4Model, type ViewId } from "@/lib/tools/c4/model";
import { availableViews, buildView, parseViewId } from "@/lib/tools/c4/views";
import { autoLayout } from "@/lib/tools/c4/layout";
import { toMermaidC4, toStructurizrDsl } from "@/lib/tools/c4/export";
import { downloadBlob, svgToPngBlob } from "@/lib/tools/mermaidExport";
import { C4Canvas } from "./C4Canvas";
import { ModelTree } from "./ModelTree";
import { ElementDrawer, type DrawerState } from "./ElementDrawer";
import styles from "./c4.module.css";

const STORAGE_KEY = "tools.poderoso.io/c4";

/**
 * O texto salvo é JSON de um arquivo que a pessoa pode ter editado à mão ou
 * trazido de outro lugar: é fronteira de confiança, então o parse cuida só do
 * "isso é JSON válido?" e delega toda a validação de formato a `sanitizeModel`.
 */
function parseModel(text: string): C4Model | null {
  try {
    return sanitizeModel(JSON.parse(text));
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
  const [selected, setSelected] = useState<string | null>(null);
  const [drawer, setDrawer] = useState<DrawerState | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  // mesma guarda do MermaidViewer: sair se já está em fullscreen, senão entrar.
  // O catch é obrigatório: em iframe ou com a permissão negada a promise rejeita
  // e a ferramenta tem que continuar utilizável em janela normal.
  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen();
    else frameRef.current?.requestFullscreen().catch(() => {});
  }, []);

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
  // elemento removido pela árvore não pode continuar "selecionado"
  const selectedAlive = selected && byId(model, selected) ? selected : null;
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

  // clampa em não-negativo: o viewBox começa em "0 0", então uma caixa arrastada
  // para coordenada negativa sai da vista (e de todo export) sem jeito de voltar
  const move = (id: string, pos: { x: number; y: number }) => {
    setModel((m) => setPosition(m, active, id, { x: Math.max(0, pos.x), y: Math.max(0, pos.y) }));
  };

  /** Serializa uma cópia do SVG, sem o transform de pan/zoom que a tela usa só
   *  para exibição: sem isso o export sairia recortado no zoom/pan atual em vez
   *  do diagrama inteiro em 1:1. O nó ao vivo (`svgRef.current`) não é tocado. */
  const serializedSvg = () => {
    const el = svgRef.current;
    if (!el) return null;
    const clone = el.cloneNode(true) as SVGSVGElement;
    clone.style.transform = "";
    clone.style.transformOrigin = "";
    return inlineCssVars(new XMLSerializer().serializeToString(clone));
  };

  const exportSvg = () => {
    const svg = serializedSvg();
    if (svg) downloadBlob(new Blob([svg], { type: "image/svg+xml" }), `c4-${active}.svg`);
  };

  const exportPng = async () => {
    const svg = serializedSvg();
    if (!svg) return;
    try {
      const bg = getComputedStyle(document.documentElement).getPropertyValue("--color-bg-alt").trim();
      downloadBlob(await svgToPngBlob(svg, layout.width, layout.height, bg), `c4-${active}.png`);
    } catch {
      toastError("Falha ao gerar PNG");
    }
  };

  const exportText = (text: string, name: string, type: string) =>
    downloadBlob(new Blob([text], { type }), name);

  const openJson = (file: File) => {
    file
      .text()
      .then((text) => {
        const parsed = parseModel(text);
        if (parsed) setModel(parsed);
        else toastError("Esse arquivo não é um modelo C4 desta ferramenta.");
      })
      .catch(() => toastError("Não foi possível ler o arquivo."));
  };

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
          <div className="mmd-btn-group">
            <button
              type="button"
              title="ver um exemplo"
              className="mmd-tool-btn"
              style={{ width: 32 }}
              onClick={() => {
                if (model.elements.length > 0 && !confirm("Isso substitui o modelo atual pelo exemplo. Continuar?"))
                  return;
                setModel(exampleModel());
              }}
            >
              <Sparkles size={15} style={{ verticalAlign: "middle" }} />
            </button>
          </div>
          <div className="mmd-btn-group">
            <button type="button" title="baixar .svg" className="mmd-tool-btn" style={{ width: 32 }} onClick={exportSvg}>
              <FileCode size={15} style={{ verticalAlign: "middle" }} />
            </button>
            <button type="button" title="baixar .png (2x)" className="mmd-tool-btn" style={{ width: 32 }} onClick={exportPng}>
              <ImageIcon size={15} style={{ verticalAlign: "middle" }} />
            </button>
            <button
              type="button"
              title="baixar Structurizr DSL"
              className="mmd-tool-btn"
              style={{ width: 32 }}
              onClick={() => exportText(toStructurizrDsl(model), `${model.name}.dsl`, "text/plain")}
            >
              <FileText size={15} style={{ verticalAlign: "middle" }} />
            </button>
            <button
              type="button"
              title="baixar Mermaid C4"
              className="mmd-tool-btn"
              style={{ width: 32 }}
              onClick={() => exportText(toMermaidC4(model, active), `c4-${active}.mmd`, "text/plain")}
            >
              <Workflow size={15} style={{ verticalAlign: "middle" }} />
            </button>
          </div>
          <div className="mmd-btn-group">
            <button
              type="button"
              title="salvar modelo (.json)"
              className="mmd-tool-btn"
              style={{ width: 32 }}
              onClick={() => exportText(JSON.stringify(model, null, 2), `${model.name}.c4.json`, "application/json")}
            >
              <Save size={15} style={{ verticalAlign: "middle" }} />
            </button>
            <label title="abrir modelo (.json)" className="mmd-tool-btn" style={{ width: 32, display: "grid", placeItems: "center", cursor: "pointer" }}>
              <FolderOpen size={15} style={{ verticalAlign: "middle" }} />
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
            <ModelTree
              model={model}
              selected={selectedAlive}
              onSelect={(id) => {
                setSelected(id);
                focusOn(id);
              }}
              onEdit={(id) => setDrawer({ mode: "edit", id })}
              onAdd={() => setDrawer({ mode: "create" })}
              onRemove={(id) => onModel((m) => removeElement(m, id))}
            />
          </aside>
          <C4Canvas
            view={view}
            model={model}
            layout={layout}
            onOpen={open}
            onMove={move}
            selected={selectedAlive}
            onSelect={setSelected}
            svgRef={svgRef}
            frameRef={frameRef}
            onToggleFullscreen={toggleFullscreen}
            onAutoLayout={() => {
              const positioned = Object.keys(model.layout[active] ?? {}).length;
              if (positioned && !confirm("Isso descarta as posições que você arrastou nesta view. Continuar?")) return;
              setModel((m) => clearLayout(m, active));
            }}
            canAutoLayout={Object.keys(model.layout[active] ?? {}).length > 0}
            onAddChild={(parentId) => {
              const el = byId(model, parentId);
              if (!el) return;
              setDrawer({ mode: "create", kind: el.kind === "system" ? "container" : "component", parent: parentId });
            }}
          />
          {drawer && <ElementDrawer model={model} state={drawer} onModel={onModel} onClose={() => setDrawer(null)} />}
        </div>
      </div>
    </ToolPanel>
  );
}
