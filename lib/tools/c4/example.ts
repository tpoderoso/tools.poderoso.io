import { addElement, addRelation, emptyModel, type C4Model } from "./model.ts";

/**
 * Modelo de demonstração, também usado pelos self-checks dos outros módulos.
 * Cobre de propósito os casos difíceis da derivação de views:
 *
 * - `cobranca -> pagamento`: relação declarada no nível de componente que
 *   precisa subir para container e para sistema
 * - `pedido -> cobranca`: relação interna a um container, que deve sumir na
 *   view de container
 * - `pedido -> pagamento` junto com `cobranca -> pagamento`: duas relações que
 *   projetam no mesmo par e viram uma aresta só
 * - `worker`: container sem nenhuma relação, que ainda assim aparece
 * - `auditor`: pessoa sem nenhuma relação, que não deve poluir a view de container
 * - `erp`: segundo sistema interno, para exercitar o Landscape com vários
 */
export function exampleModel(): C4Model {
  let m = emptyModel("Loja");

  m = addElement(m, { kind: "person", name: "Cliente", description: "compra na loja", external: false });
  m = addElement(m, { kind: "person", name: "Auditor", description: "confere os registros", external: false });

  m = addElement(m, { kind: "system", name: "Checkout", description: "carrinho e pagamento", external: false });
  m = addElement(m, { kind: "system", name: "ERP", description: "estoque e faturamento", external: false });
  m = addElement(m, { kind: "system", name: "Pagamento", description: "gateway do adquirente", external: true });

  m = addElement(m, {
    kind: "container", name: "Web", description: "loja no navegador",
    technology: "React", external: false, parent: "checkout", tags: ["browser"],
  });
  m = addElement(m, {
    kind: "container", name: "API", description: "regras do pedido",
    technology: "Node", external: false, parent: "checkout",
  });
  m = addElement(m, {
    kind: "container", name: "Banco", description: "pedidos e itens",
    technology: "Postgres", external: false, parent: "checkout", tags: ["database"],
  });
  m = addElement(m, {
    kind: "container", name: "Worker", description: "reprocessa cobranças",
    technology: "Node", external: false, parent: "checkout",
  });

  m = addElement(m, {
    kind: "component", name: "Pedido", description: "monta e valida o pedido",
    technology: "TypeScript", external: false, parent: "api",
  });
  m = addElement(m, {
    kind: "component", name: "Cobranca", description: "fala com o adquirente",
    technology: "TypeScript", external: false, parent: "api",
  });

  m = addRelation(m, { from: "cliente", to: "web", label: "compra em", technology: "HTTPS" });
  m = addRelation(m, { from: "web", to: "api", label: "chama", technology: "HTTPS/JSON" });
  m = addRelation(m, { from: "pedido", to: "cobranca", label: "delega a" });
  m = addRelation(m, { from: "cobranca", to: "pagamento", label: "cobra via", technology: "HTTPS" });
  m = addRelation(m, { from: "pedido", to: "pagamento", label: "consulta" });
  m = addRelation(m, { from: "api", to: "banco", label: "lê e grava", technology: "SQL" });
  m = addRelation(m, { from: "api", to: "erp", label: "envia pedido para" });

  return m;
}

// ponytail: self-check — a forma do exemplo é contrato dos outros self-checks
if (process.env.NODE_ENV !== "production") {
  const m = exampleModel();
  const ids = m.elements.map((e) => e.id).join(",");
  const esperado =
    "cliente,auditor,checkout,erp,pagamento,web,api,banco,worker,pedido,cobranca";
  if (ids !== esperado) throw new Error(`c4/example ids: ${ids} != ${esperado}`);
  if (m.relations.length !== 7) throw new Error(`c4/example relações: ${m.relations.length} != 7`);
}
