export type ElementKind = "person" | "system" | "container" | "component";

export interface C4Element {
  id: string;
  kind: ElementKind;
  name: string;
  description: string;
  technology?: string; // container e component
  external: boolean; // só significativo em person e system
  parent?: string; // container -> system.id; component -> container.id
  tags?: string[]; // "database", "queue", "browser" — muda a forma da caixa
}

export interface C4Relation {
  id: string;
  from: string;
  to: string;
  label: string;
  technology?: string;
}

export type ViewId =
  | "landscape"
  | `context:${string}`
  | `container:${string}`
  | `component:${string}`;

export interface C4Model {
  version: 1;
  name: string;
  elements: C4Element[];
  relations: C4Relation[];
  /**
   * Posições que a pessoa arrastou, por view. A chave externa é o ViewId
   * serializado: `Record<ViewId, …>` com template literal type exigiria
   * enumerar todas as chaves possíveis, então fica `string`.
   */
  layout: Record<string, Record<string, { x: number; y: number }>>;
  dismissed: string[]; // ids de sugestão dispensadas
}

export function emptyModel(name = "Novo modelo"): C4Model {
  return { version: 1, name, elements: [], relations: [], layout: {}, dismissed: [] };
}

export function slugify(name: string): string {
  const s = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // tira os acentos que o NFD separou
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s || "item";
}

function uniqueIn(taken: Set<string>, base: string): string {
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

export function byId(model: C4Model, id: string): C4Element | undefined {
  return model.elements.find((e) => e.id === id);
}

export function childrenOf(model: C4Model, id: string): C4Element[] {
  return model.elements.filter((e) => e.parent === id);
}

/**
 * Do próprio elemento até a raiz, inclusive. O teto de 8 saltos é defensivo:
 * um JSON importado de fora pode ter um ciclo de `parent` e travaria o laço.
 */
export function ancestorsOf(model: C4Model, id: string): string[] {
  const chain: string[] = [];
  let cur = byId(model, id);
  while (cur && chain.length < 8) {
    if (chain.includes(cur.id)) break;
    chain.push(cur.id);
    cur = cur.parent ? byId(model, cur.parent) : undefined;
  }
  return chain;
}

function requireValidParent(model: C4Model, kind: ElementKind, parent?: string): void {
  if (kind === "person" || kind === "system") {
    if (parent) throw new Error(`c4: ${kind} não tem pai`);
    return;
  }
  const p = parent ? byId(model, parent) : undefined;
  if (kind === "container" && (!p || p.kind !== "system" || p.external))
    throw new Error("c4: container precisa de um sistema interno como pai");
  if (kind === "component" && (!p || p.kind !== "container"))
    throw new Error("c4: componente precisa de um container como pai");
}

export function addElement(model: C4Model, el: Omit<C4Element, "id">): C4Model {
  requireValidParent(model, el.kind, el.parent);
  const id = uniqueIn(new Set(model.elements.map((e) => e.id)), slugify(el.name));
  return { ...model, elements: [...model.elements, { ...el, id }] };
}

/** `kind` e `parent` são estruturais: mudar um deles é remover e recriar. */
export function updateElement(
  model: C4Model,
  id: string,
  patch: Partial<Omit<C4Element, "id" | "kind" | "parent">>,
): C4Model {
  return { ...model, elements: model.elements.map((e) => (e.id === id ? { ...e, ...patch } : e)) };
}

/** Remove o elemento, seus descendentes, as relações que os tocam e o layout deles. */
export function removeElement(model: C4Model, id: string): C4Model {
  const doomed = new Set<string>([id]);
  for (let grew = true; grew; ) {
    grew = false;
    for (const e of model.elements) {
      if (e.parent && doomed.has(e.parent) && !doomed.has(e.id)) {
        doomed.add(e.id);
        grew = true;
      }
    }
  }
  const layout: C4Model["layout"] = {};
  for (const [view, pos] of Object.entries(model.layout)) {
    const focus = view.includes(":") ? view.slice(view.indexOf(":") + 1) : "";
    if (focus && doomed.has(focus)) continue; // a view em si deixou de existir
    const kept = Object.entries(pos).filter(([k]) => !doomed.has(k));
    if (kept.length) layout[view] = Object.fromEntries(kept);
  }
  return {
    ...model,
    elements: model.elements.filter((e) => !doomed.has(e.id)),
    relations: model.relations.filter((r) => !doomed.has(r.from) && !doomed.has(r.to)),
    layout,
  };
}

export function addRelation(model: C4Model, r: Omit<C4Relation, "id">): C4Model {
  if (r.from === r.to) throw new Error("c4: relação de um elemento com ele mesmo");
  if (!byId(model, r.from) || !byId(model, r.to)) throw new Error("c4: relação com elemento inexistente");
  if (ancestorsOf(model, r.from).includes(r.to) || ancestorsOf(model, r.to).includes(r.from))
    throw new Error("c4: relação entre um elemento e um ancestral dele");
  const id = uniqueIn(new Set(model.relations.map((x) => x.id)), `${r.from}--${r.to}`);
  return { ...model, relations: [...model.relations, { ...r, id }] };
}

export function updateRelation(
  model: C4Model,
  id: string,
  patch: Partial<Omit<C4Relation, "id" | "from" | "to">>,
): C4Model {
  return { ...model, relations: model.relations.map((r) => (r.id === id ? { ...r, ...patch } : r)) };
}

export function removeRelation(model: C4Model, id: string): C4Model {
  return { ...model, relations: model.relations.filter((r) => r.id !== id) };
}

export function setPosition(
  model: C4Model,
  viewId: string,
  elementId: string,
  pos: { x: number; y: number },
): C4Model {
  return {
    ...model,
    layout: { ...model.layout, [viewId]: { ...(model.layout[viewId] ?? {}), [elementId]: pos } },
  };
}

/**
 * Descarta as posições arrastadas de uma view, devolvendo o comando ao
 * autoLayout. Retorna o próprio modelo quando não há nada a limpar — assim
 * quem chama pode comparar por identidade para decidir se pede confirmação.
 */
export function clearLayout(model: C4Model, viewId: string): C4Model {
  if (!model.layout[viewId]) return model;
  const layout = { ...model.layout };
  delete layout[viewId];
  return { ...model, layout };
}

export function dismiss(model: C4Model, suggestionId: string): C4Model {
  if (model.dismissed.includes(suggestionId)) return model;
  return { ...model, dismissed: [...model.dismissed, suggestionId] };
}

const ELEMENT_KINDS: readonly ElementKind[] = ["person", "system", "container", "component"];

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === "string");
}

function sanitizeElement(raw: unknown): C4Element | null {
  if (!raw || typeof raw !== "object") return null;
  const e = raw as Record<string, unknown>;
  if (typeof e.id !== "string" || e.id === "") return null;
  if (typeof e.kind !== "string" || !ELEMENT_KINDS.includes(e.kind as ElementKind)) return null;
  if (typeof e.name !== "string") return null;
  if (typeof e.description !== "string") return null;
  if (typeof e.external !== "boolean") return null;
  if (e.parent !== undefined && typeof e.parent !== "string") return null;
  if (e.technology !== undefined && typeof e.technology !== "string") return null;
  if (e.tags !== undefined && !isStringArray(e.tags)) return null;
  const out: C4Element = {
    id: e.id,
    kind: e.kind as ElementKind,
    name: e.name,
    description: e.description,
    external: e.external,
  };
  if (typeof e.parent === "string") out.parent = e.parent;
  if (typeof e.technology === "string") out.technology = e.technology;
  if (isStringArray(e.tags)) out.tags = e.tags;
  return out;
}

function sanitizeRelation(raw: unknown, knownIds: Set<string>): C4Relation | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== "string") return null;
  if (typeof r.from !== "string" || typeof r.to !== "string") return null;
  if (typeof r.label !== "string") return null;
  if (!knownIds.has(r.from) || !knownIds.has(r.to)) return null;
  if (r.technology !== undefined && typeof r.technology !== "string") return null;
  const out: C4Relation = { id: r.id, from: r.from, to: r.to, label: r.label };
  if (typeof r.technology === "string") out.technology = r.technology;
  return out;
}

function sanitizeLayout(raw: unknown): C4Model["layout"] {
  const out: C4Model["layout"] = {};
  if (!raw || typeof raw !== "object") return out;
  for (const [view, positions] of Object.entries(raw as Record<string, unknown>)) {
    if (!positions || typeof positions !== "object") continue;
    const kept: Record<string, { x: number; y: number }> = {};
    for (const [id, pos] of Object.entries(positions as Record<string, unknown>)) {
      if (!pos || typeof pos !== "object") continue;
      const p = pos as Record<string, unknown>;
      if (typeof p.x === "number" && Number.isFinite(p.x) && typeof p.y === "number" && Number.isFinite(p.y)) {
        kept[id] = { x: p.x, y: p.y };
      }
    }
    if (Object.keys(kept).length) out[view] = kept;
  }
  return out;
}

/**
 * Import de JSON é a única porta de entrada de dado externo nesta ferramenta
 * (o resto do estado nasce de cliques na própria UI), então é fronteira de
 * confiança: um arquivo editado à mão, meio-truncado ou vindo de outra versão
 * da ferramenta é um formato plausível mas inválido, e `parseModel`/`suggest`/
 * o renderer do SVG não toleram um `description` ausente ou um `layout.x`
 * string sem lançar. Como este app não tem `error.tsx`, esse throw aconteceria
 * durante o render e derrubaria a ferramenta inteira, não só o import. Por
 * isso este validador filtra em vez de confiar: descarta silenciosamente
 * qualquer elemento, relação ou posição de layout fora de forma, em vez de
 * lançar, para o resto do modelo continuar utilizável.
 */
export function sanitizeModel(raw: unknown): C4Model | null {
  if (!raw || typeof raw !== "object") return null;
  const m = raw as Record<string, unknown>;
  if (m.version !== 1 || !Array.isArray(m.elements) || !Array.isArray(m.relations)) return null;

  const elements = m.elements.map(sanitizeElement).filter((e): e is C4Element => e !== null);
  const knownIds = new Set(elements.map((e) => e.id));
  const relations = m.relations.map((r) => sanitizeRelation(r, knownIds)).filter((r): r is C4Relation => r !== null);

  return {
    version: 1,
    name: typeof m.name === "string" ? m.name : "Modelo",
    elements,
    relations,
    layout: sanitizeLayout(m.layout),
    dismissed: isStringArray(m.dismissed) ? m.dismissed : [],
  };
}

// ponytail: self-check — roda no import (dev/build) e via `node lib/tools/c4/model.ts`
if (process.env.NODE_ENV !== "production") {
  const eq = (got: unknown, exp: unknown, what: string) => {
    if (JSON.stringify(got) !== JSON.stringify(exp))
      throw new Error(`c4/model ${what}: ${JSON.stringify(got)} != ${JSON.stringify(exp)}`);
  };
  const throws = (fn: () => unknown, what: string) => {
    try {
      fn();
    } catch {
      return;
    }
    throw new Error(`c4/model ${what}: deveria ter lançado`);
  };

  eq(slugify("Área de Pagamentos!"), "area-de-pagamentos", "slugify acentos e pontuação");
  eq(slugify("  "), "item", "slugify vazio tem fallback");

  let m = emptyModel("teste");
  m = addElement(m, { kind: "system", name: "Checkout", description: "", external: false });
  m = addElement(m, { kind: "system", name: "Checkout", description: "", external: false });
  eq(m.elements.map((e) => e.id), ["checkout", "checkout-2"], "id colidido ganha sufixo");

  throws(() => addElement(m, { kind: "container", name: "X", description: "", external: false }), "container sem pai");
  throws(
    () => addElement(m, { kind: "component", name: "X", description: "", external: false, parent: "checkout" }),
    "componente com pai sistema",
  );

  m = addElement(m, { kind: "container", name: "API", description: "", external: false, parent: "checkout" });
  m = addElement(m, { kind: "component", name: "Pedido", description: "", external: false, parent: "api" });
  m = addElement(m, { kind: "person", name: "Cliente", description: "", external: false });
  m = addRelation(m, { from: "cliente", to: "pedido", label: "usa" });
  m = setPosition(m, "container:checkout", "api", { x: 10, y: 20 });

  throws(() => addRelation(m, { from: "api", to: "api", label: "x" }), "relação consigo mesmo");
  throws(() => addRelation(m, { from: "pedido", to: "checkout", label: "x" }), "relação com ancestral");

  const gone = removeElement(m, "checkout");
  eq(gone.elements.map((e) => e.id), ["checkout-2", "cliente"], "remoção cascateia nos descendentes");
  eq(gone.relations.length, 0, "remoção leva as relações junto");
  eq(Object.keys(gone.layout), [], "remoção leva o layout da view junto");

  eq(ancestorsOf(m, "pedido"), ["pedido", "api", "checkout"], "cadeia de ancestrais");

  const d1 = dismiss(m, "orphan:api");
  eq(dismiss(d1, "orphan:api").dismissed, ["orphan:api"], "dispensar é idempotente");

  // sanitizeModel: fronteira de confiança do import de JSON
  const validEl = { id: "a", kind: "system", name: "A", description: "d", external: false };
  const raw1 = { version: 1, name: "M", elements: [validEl], relations: [], layout: {}, dismissed: [] };
  eq(sanitizeModel(raw1)?.elements, [validEl], "sanitizeModel aceita elemento válido");

  const missingDesc = { id: "b", kind: "system", name: "B", external: false };
  const raw2 = { version: 1, elements: [validEl, missingDesc], relations: [] };
  eq(sanitizeModel(raw2)?.elements.map((e) => e.id), ["a"], "sanitizeModel descarta elemento sem description");

  const raw3 = {
    version: 1,
    elements: [validEl],
    relations: [{ id: "r1", from: "a", to: "nao-existe", label: "x" }],
  };
  eq(sanitizeModel(raw3)?.relations, [], "sanitizeModel descarta relação para elemento inexistente/descartado");

  const raw4 = {
    version: 1,
    elements: [validEl],
    relations: [],
    layout: { landscape: { a: { x: "10", y: 20 } } },
  };
  eq(sanitizeModel(raw4)?.layout, {}, "sanitizeModel descarta posição com x/y não numérico e não deixa {} sobrando");

  eq(sanitizeModel(null), null, "sanitizeModel rejeita não-objeto");
  eq(sanitizeModel({ version: 2, elements: [], relations: [] }), null, "sanitizeModel rejeita versão errada");

  // clearLayout: apaga as posições de UMA view, sem tocar nas outras
  {
    const base = emptyModel();
    const comPos = setPosition(setPosition(base, "landscape", "a", { x: 1, y: 2 }), "container:s", "b", { x: 3, y: 4 });
    const limpo = clearLayout(comPos, "landscape");
    if (limpo.layout.landscape !== undefined) throw new Error("c4/model clearLayout: a view limpa continuou no layout");
    if (limpo.layout["container:s"]?.b?.x !== 3) throw new Error("c4/model clearLayout: mexeu na view errada");
    if (clearLayout(base, "landscape") !== base) throw new Error("c4/model clearLayout: view sem posição deveria ser no-op");
  }
}
