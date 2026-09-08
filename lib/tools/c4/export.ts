import { byId, childrenOf, type C4Model, type ViewId } from "./model.ts";
import { buildView, parseViewId } from "./views.ts";
import { exampleModel } from "./example.ts";

/** Nem Structurizr nem Mermaid aceitam "-" em identificador, e o slugify produz. */
function ident(id: string): string {
  return id.replace(/-/g, "_");
}

function q(text: string): string {
  return `"${text.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function elementLines(model: C4Model, id: string, indent: string, out: string[]): void {
  const e = byId(model, id);
  if (!e) return;
  const kw =
    e.kind === "person" ? "person" : e.kind === "system" ? "softwareSystem" : e.kind === "container" ? "container" : "component";
  const args = [q(e.name), q(e.description)];
  if (e.kind === "container" || e.kind === "component") args.push(q(e.technology ?? ""));

  const kids = childrenOf(model, id);
  const head = `${indent}${ident(e.id)} = ${kw} ${args.join(" ")}`;
  if (!kids.length && !e.external) {
    out.push(head);
    return;
  }
  out.push(`${head} {`);
  if (e.external) out.push(`${indent}    tags "External"`);
  for (const k of kids) elementLines(model, k.id, `${indent}    `, out);
  out.push(`${indent}}`);
}

export function toStructurizrDsl(model: C4Model): string {
  const out: string[] = [`workspace ${q(model.name)} {`, "    model {"];

  for (const p of model.elements.filter((e) => e.kind === "person")) elementLines(model, p.id, "        ", out);
  for (const s of model.elements.filter((e) => e.kind === "system")) elementLines(model, s.id, "        ", out);

  for (const r of model.relations) {
    const args = [q(r.label)];
    if (r.technology) args.push(q(r.technology));
    out.push(`        ${ident(r.from)} -> ${ident(r.to)} ${args.join(" ")}`);
  }

  out.push("    }", "    views {");
  const block = (head: string) => out.push(`        ${head} {`, "            include *", "            autoLayout", "        }");

  block("systemLandscape");
  for (const s of model.elements.filter((e) => e.kind === "system" && !e.external)) {
    block(`systemContext ${ident(s.id)}`);
    if (childrenOf(model, s.id).length) block(`container ${ident(s.id)}`);
  }
  for (const c of model.elements.filter((e) => e.kind === "container")) {
    if (childrenOf(model, c.id).length) block(`component ${ident(c.id)}`);
  }
  out.push("        theme default", "    }", "}");
  return out.join("\n");
}

export function toMermaidC4(model: C4Model, viewId: ViewId): string {
  const view = buildView(model, viewId);
  const { kind } = parseViewId(viewId);
  const header = kind === "container" ? "C4Container" : kind === "component" ? "C4Component" : "C4Context";
  const out = [header, `    title ${view.title}`];

  const boundary = view.boundaries[0];
  const inside = new Set(boundary?.children ?? []);

  const decl = (id: string, indent: string) => {
    const e = byId(model, id);
    if (!e) return;
    // ordem dos argumentos do Mermaid C4: alias, rótulo, [tecnologia], descrição
    const args = [ident(e.id), q(e.name)];
    let fn: string;
    if (e.kind === "person") fn = e.external ? "Person_Ext" : "Person";
    else if (e.kind === "system") fn = e.external ? "System_Ext" : "System";
    else {
      fn = e.kind === "container" ? "Container" : "Component";
      args.push(q(e.technology ?? ""));
    }
    args.push(q(e.description));
    out.push(`${indent}${fn}(${args.join(", ")})`);
  };

  for (const id of view.nodes) if (!inside.has(id)) decl(id, "    ");
  if (boundary) {
    const fn = kind === "component" ? "Container_Boundary" : "System_Boundary";
    out.push(`    ${fn}(${ident(boundary.id)}, ${q(boundary.label)}) {`);
    for (const id of view.nodes) if (inside.has(id)) decl(id, "        ");
    out.push("    }");
  }
  for (const e of view.edges) {
    const args = [ident(e.from), ident(e.to), q(e.label)];
    if (e.technology) args.push(q(e.technology));
    out.push(`    Rel(${args.join(", ")})`);
  }
  return out.join("\n");
}

// ponytail: self-check — roda no import (dev/build) e via `node lib/tools/c4/export.ts`
if (process.env.NODE_ENV !== "production") {
  const has = (text: string, needle: string, what: string) => {
    if (!text.includes(needle)) throw new Error(`c4/export ${what}: falta ${JSON.stringify(needle)}`);
  };
  const m = exampleModel();

  const dsl = toStructurizrDsl(m);
  has(dsl, 'workspace "Loja" {', "cabeçalho do workspace");
  has(dsl, 'cliente = person "Cliente" "compra na loja"', "pessoa sem bloco");
  has(dsl, 'checkout = softwareSystem "Checkout" "carrinho e pagamento" {', "sistema com bloco");
  has(dsl, 'web = container "Web" "loja no navegador" "React"', "container com tecnologia");
  has(dsl, 'pedido = component "Pedido" "monta e valida o pedido" "TypeScript"', "componente");
  has(dsl, 'tags "External"', "sistema externo marcado");
  has(dsl, 'cliente -> web "compra em" "HTTPS"', "relação com tecnologia");
  has(dsl, "systemContext checkout {", "view de contexto");
  has(dsl, "component api {", "view de componente");

  const mmd = toMermaidC4(m, "container:checkout");
  has(mmd, "C4Container", "cabeçalho do mermaid");
  has(mmd, 'System_Boundary(checkout, "Checkout") {', "boundary do mermaid");
  has(mmd, 'Container(web, "Web", "React", "loja no navegador")', "container do mermaid");
  has(mmd, 'System_Ext(pagamento, "Pagamento", "gateway do adquirente")', "externo do mermaid");
  has(mmd, 'Rel(api, pagamento, "")', "aresta elevada sem rótulo");

  const comp = toMermaidC4(m, "component:api");
  has(comp, "C4Component", "cabeçalho de componente");
  has(comp, 'Container_Boundary(api, "API") {', "boundary de componente");

  // identificador com "-" e nome com aspas não podem quebrar a sintaxe
  const esc = toStructurizrDsl({
    ...m,
    name: 'Loja "boa"',
    elements: [{ id: "meu-sys", kind: "system", name: 'Sis "X"', description: "", external: false }],
    relations: [],
  });
  has(esc, 'workspace "Loja \\"boa\\"" {', "aspas escapadas no nome do workspace");
  has(esc, 'meu_sys = softwareSystem "Sis \\"X\\"" ""', "hífen vira underscore e aspas escapam");
}
