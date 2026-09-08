import { ancestorsOf, byId, childrenOf, type C4Model, type C4Relation, type ViewId } from "./model.ts";
import { exampleModel } from "./example.ts";

export interface ViewEdge {
  from: string;
  to: string;
  label: string;
  technology?: string;
  /** true = não foi declarada entre esses dois, foi elevada de um nível abaixo. */
  implied: boolean;
}

export interface ViewBoundary {
  id: string;
  label: string;
  children: string[];
}

export interface C4View {
  id: ViewId;
  kind: "landscape" | "context" | "container" | "component";
  title: string;
  focus?: string;
  nodes: string[];
  edges: ViewEdge[];
  boundaries: ViewBoundary[];
}

export function parseViewId(id: ViewId): { kind: C4View["kind"]; focus?: string } {
  if (id === "landscape") return { kind: "landscape" };
  const i = id.indexOf(":");
  return { kind: id.slice(0, i) as C4View["kind"], focus: id.slice(i + 1) };
}

/**
 * Passo 1 do algoritmo: o universo de elementos que a view pode mostrar, definido
 * só pela estrutura do modelo, sem olhar relação nenhuma. É o que evita a
 * circularidade de "mostrar quem se relaciona com quem".
 *
 * Excluir o sistema em foco (e, na view de componente, o container em foco) é o
 * que faz um elemento de fora colapsar na caixa fechada certa: na view de
 * container de S, um componente de outro sistema projeta no sistema dele.
 */
function candidatesFor(model: C4Model, kind: C4View["kind"], focus?: string): Set<string> {
  const persons = model.elements.filter((e) => e.kind === "person").map((e) => e.id);
  const systems = model.elements.filter((e) => e.kind === "system").map((e) => e.id);

  if (kind === "landscape" || kind === "context") return new Set([...persons, ...systems]);

  if (kind === "container") {
    const s = focus ?? "";
    return new Set([...persons, ...systems.filter((id) => id !== s), ...childrenOf(model, s).map((e) => e.id)]);
  }

  const c = focus ?? "";
  const s = byId(model, c)?.parent ?? "";
  const siblings = childrenOf(model, s)
    .map((e) => e.id)
    .filter((id) => id !== c);
  return new Set([
    ...persons,
    ...systems.filter((id) => id !== s),
    ...siblings,
    ...childrenOf(model, c).map((e) => e.id),
  ]);
}

/** Passo 3: sobe pela cadeia `parent` até achar um elemento do conjunto candidato. */
function projectTo(model: C4Model, cands: Set<string>, id: string): string | undefined {
  for (const a of ancestorsOf(model, id)) if (cands.has(a)) return a;
  return undefined;
}

function edgesFor(model: C4Model, cands: Set<string>): ViewEdge[] {
  const groups = new Map<string, { a: string; b: string; rels: C4Relation[] }>();
  for (const r of model.relations) {
    const a = projectTo(model, cands, r.from);
    const b = projectTo(model, cands, r.to);
    // a === b descarta as relações internas: dois componentes do mesmo container
    // projetam no mesmo nó, e a ligação não existe naquele nível.
    if (!a || !b || a === b) continue;
    const key = `${a}|${b}`; // "|" é seguro: slugify só produz [a-z0-9-]
    const g = groups.get(key) ?? { a, b, rels: [] };
    g.rels.push(r);
    groups.set(key, g);
  }

  return [...groups.values()].map(({ a, b, rels }) => {
    const declared = rels.find((r) => r.from === a && r.to === b);
    if (declared)
      return { from: a, to: b, label: declared.label, technology: declared.technology, implied: false };
    const labels = new Set(rels.map((r) => r.label).filter(Boolean));
    return { from: a, to: b, label: labels.size === 1 ? [...labels][0] : "", implied: true };
  });
}

function titleFor(model: C4Model, kind: C4View["kind"], focus?: string): string {
  const name = focus ? byId(model, focus)?.name ?? focus : "";
  if (kind === "landscape") return "Landscape";
  if (kind === "context") return `Contexto: ${name}`;
  if (kind === "container") return `Containers: ${name}`;
  return `Componentes: ${name}`;
}

export function buildView(model: C4Model, viewId: ViewId): C4View {
  const { kind, focus } = parseViewId(viewId);
  const cands = candidatesFor(model, kind, focus);

  // Passo 2: o boundary tracejado.
  const boundaries: ViewBoundary[] = [];
  if ((kind === "container" || kind === "component") && focus) {
    boundaries.push({
      id: focus,
      label: byId(model, focus)?.name ?? focus,
      children: childrenOf(model, focus).map((e) => e.id),
    });
  }

  const allEdges = edgesFor(model, cands);

  // Passo 4: filtra os candidatos.
  let nodes: string[];
  if (kind === "landscape") {
    nodes = [...cands]; // o Landscape é o inventário: mostra tudo
  } else if (kind === "context") {
    const keep = new Set<string>(focus ? [focus] : []);
    for (const e of allEdges) {
      if (e.from === focus) keep.add(e.to);
      if (e.to === focus) keep.add(e.from);
    }
    nodes = [...cands].filter((id) => keep.has(id));
  } else {
    const inside = new Set(boundaries[0]?.children ?? []);
    const touched = new Set<string>();
    for (const e of allEdges) {
      touched.add(e.from);
      touched.add(e.to);
    }
    // o conteúdo do boundary aparece sempre, mesmo isolado: um container recém
    // criado pelo wizard precisa aparecer antes de ser ligado em alguma coisa
    nodes = [...cands].filter((id) => inside.has(id) || touched.has(id));
  }

  const nodeSet = new Set(nodes);
  const edges = allEdges.filter((e) => nodeSet.has(e.from) && nodeSet.has(e.to));
  return { id: viewId, kind, title: titleFor(model, kind, focus), focus, nodes, edges, boundaries };
}

export function availableViews(model: C4Model): { id: ViewId; title: string }[] {
  const out: { id: ViewId; title: string }[] = [{ id: "landscape", title: "Landscape" }];
  for (const s of model.elements.filter((e) => e.kind === "system" && !e.external)) {
    out.push({ id: `context:${s.id}`, title: `Contexto: ${s.name}` });
    if (childrenOf(model, s.id).length) out.push({ id: `container:${s.id}`, title: `Containers: ${s.name}` });
  }
  for (const c of model.elements.filter((e) => e.kind === "container")) {
    if (childrenOf(model, c.id).length) out.push({ id: `component:${c.id}`, title: `Componentes: ${c.name}` });
  }
  return out;
}

// ponytail: self-check — roda no import (dev/build) e via `node lib/tools/c4/views.ts`
if (process.env.NODE_ENV !== "production") {
  const m = exampleModel();
  const eq = (got: unknown, exp: unknown, what: string) => {
    if (JSON.stringify(got) !== JSON.stringify(exp))
      throw new Error(`c4/views ${what}: got ${JSON.stringify(got)} exp ${JSON.stringify(exp)}`);
  };
  const edge = (v: C4View, from: string, to: string) => v.edges.find((e) => e.from === from && e.to === to);

  const land = buildView(m, "landscape");
  eq(land.nodes, ["cliente", "auditor", "checkout", "erp", "pagamento"], "landscape mostra tudo");
  eq(land.edges.length, 3, "landscape tem 3 arestas");
  eq(edge(land, "checkout", "pagamento")?.implied, true, "componente para externo sobe ate sistema");
  eq(edge(land, "checkout", "pagamento")?.label, "", "rotulos divergentes no mesmo par viram vazio");
  eq(edge(land, "cliente", "checkout")?.label, "compra em", "rotulo unico e preservado ao subir");
  eq(edge(land, "web", "api"), undefined, "relacao interna ao sistema nao aparece no landscape");

  const cont = buildView(m, "container:checkout");
  eq(cont.nodes, ["cliente", "erp", "pagamento", "web", "api", "banco", "worker"], "nos da view de container");
  eq(cont.nodes.includes("auditor"), false, "pessoa sem relacao com o sistema fica de fora");
  eq(cont.nodes.includes("worker"), true, "container sem relacao aparece por ser filho do boundary");
  eq(edge(cont, "pedido", "cobranca"), undefined, "relacao entre irmaos do mesmo container some");
  eq(edge(cont, "api", "pagamento")?.implied, true, "componente para externo sobe ate o container");
  eq(edge(cont, "web", "api")?.implied, false, "relacao declarada neste nivel nao e implicita");
  eq(
    cont.boundaries,
    [{ id: "checkout", label: "Checkout", children: ["web", "api", "banco", "worker"] }],
    "boundary da view de container",
  );

  const comp = buildView(m, "component:api");
  eq(comp.nodes, ["cliente", "pagamento", "web", "pedido", "cobranca"], "nos da view de componente");
  eq(edge(comp, "pedido", "cobranca")?.implied, false, "relacao entre componentes aparece declarada");
  eq(edge(comp, "web", "api"), undefined, "relacao container para container nao vai para um componente");

  const ctx = buildView(m, "context:checkout");
  eq(ctx.nodes, ["cliente", "checkout", "erp", "pagamento"], "contexto e o landscape filtrado nos vizinhos");

  eq(
    availableViews(m).map((v) => v.id),
    ["landscape", "context:checkout", "container:checkout", "context:erp", "component:api"],
    "views disponiveis",
  );
}
