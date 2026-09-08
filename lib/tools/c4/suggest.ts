import { addElement, byId, childrenOf, dismiss, emptyModel, type C4Model, type ElementKind } from "./model.ts";
import { exampleModel } from "./example.ts";

export type SuggestionAction =
  | { type: "add"; kind: ElementKind; parent?: string; external?: boolean }
  | { type: "edit"; elementId: string; field: "description" | "technology" }
  | { type: "relate"; elementId: string }
  | { type: "editRelation"; relationId: string };

export interface Suggestion {
  /** `${rule}:${alvo}` — estável, é o que vai para `dismissed[]`. Renomear um
   *  elemento não ressuscita a sugestão, porque o id do elemento não muda. */
  id: string;
  rule: string;
  priority: number;
  question: string;
  /** A mesma pendência em forma declarativa, para a lista. `question` é o que
   *  se pergunta a quem vai preencher; `issue` é o que se diz a quem revisa. */
  issue: string;
  target?: string;
  action: SuggestionAction;
}

/**
 * Um elemento está órfão quando nem ele nem nenhum descendente dele participa de
 * alguma relação. Sem olhar os descendentes, um sistema cujas ligações foram
 * todas declaradas no nível de container apareceria como órfão, que é falso.
 */
function isOrphan(model: C4Model, id: string): boolean {
  const family = new Set<string>([id]);
  for (let grew = true; grew; ) {
    grew = false;
    for (const e of model.elements) {
      if (e.parent && family.has(e.parent) && !family.has(e.id)) {
        family.add(e.id);
        grew = true;
      }
    }
  }
  return !model.relations.some((r) => family.has(r.from) || family.has(r.to));
}

export function suggest(model: C4Model): Suggestion[] {
  const out: Suggestion[] = [];
  const push = (s: Suggestion) => out.push(s);
  const systems = model.elements.filter((e) => e.kind === "system" && !e.external);

  if (!model.elements.some((e) => e.kind === "system")) {
    push({
      id: "empty:",
      rule: "empty",
      priority: 0,
      question: "Qual sistema você está desenhando?",
      issue: "nenhum sistema no modelo",
      action: { type: "add", kind: "system", external: false },
    });
  }

  if (systems.length && !model.elements.some((e) => e.kind === "person")) {
    push({
      id: `no-people:${systems[0].id}`,
      rule: "no-people",
      priority: 10,
      question: `Quem usa o ${systems[0].name}?`,
      issue: `${systems[0].name} não tem quem use`,
      target: systems[0].id,
      action: { type: "add", kind: "person" },
    });
  }

  for (const s of systems) {
    if (!childrenOf(model, s.id).length)
      push({
        id: `system-no-containers:${s.id}`,
        rule: "system-no-containers",
        priority: 20,
        question: `De que partes o ${s.name} é feito?`,
        issue: `${s.name} não tem containers`,
        target: s.id,
        action: { type: "add", kind: "container", parent: s.id },
      });
  }

  for (const e of model.elements) {
    if (isOrphan(model, e.id))
      push({
        id: `orphan:${e.id}`,
        rule: "orphan",
        priority: 30,
        question: `Com quem o ${e.name} conversa?`,
        issue: `${e.name} não conversa com ninguém`,
        target: e.id,
        action: { type: "relate", elementId: e.id },
      });
  }

  for (const r of model.relations) {
    if (r.label.trim()) continue;
    const a = byId(model, r.from)?.name ?? r.from;
    const b = byId(model, r.to)?.name ?? r.to;
    push({
      id: `relation-no-label:${r.id}`,
      rule: "relation-no-label",
      priority: 40,
      question: `O que trafega entre ${a} e ${b}?`,
      issue: `a ligação ${a} → ${b} não tem rótulo`,
      action: { type: "editRelation", relationId: r.id },
    });
  }

  for (const e of model.elements) {
    if ((e.kind === "container" || e.kind === "component") && !e.technology?.trim())
      push({
        id: `no-tech:${e.id}`,
        rule: "no-tech",
        priority: 50,
        question: `Em que o ${e.name} é escrito?`,
        issue: `${e.name} sem tecnologia`,
        target: e.id,
        action: { type: "edit", elementId: e.id, field: "technology" },
      });
  }

  for (const e of model.elements) {
    if (!e.description.trim())
      push({
        id: `no-description:${e.id}`,
        rule: "no-description",
        priority: 60,
        question: `O que o ${e.name} faz?`,
        issue: `${e.name} sem descrição`,
        target: e.id,
        action: { type: "edit", elementId: e.id, field: "description" },
      });
  }

  const hidden = new Set(model.dismissed);
  return out.filter((s) => !hidden.has(s.id)).sort((a, b) => a.priority - b.priority);
}

// ponytail: self-check — roda no import (dev/build) e via `node lib/tools/c4/suggest.ts`
if (process.env.NODE_ENV !== "production") {
  const eq = (got: unknown, exp: unknown, what: string) => {
    if (JSON.stringify(got) !== JSON.stringify(exp))
      throw new Error(`c4/suggest ${what}: got ${JSON.stringify(got)} exp ${JSON.stringify(exp)}`);
  };

  // a trilha inicial emerge das regras, não é programada
  const vazio = emptyModel();
  eq(suggest(vazio)[0]?.question, "Qual sistema você está desenhando?", "modelo vazio pergunta o sistema");

  const comSistema = addElement(vazio, { kind: "system", name: "Checkout", description: "vende", external: false });
  eq(suggest(comSistema)[0]?.question, "Quem usa o Checkout?", "com sistema e sem pessoa, pergunta quem usa");

  const comPessoa = addElement(comSistema, { kind: "person", name: "Cliente", description: "compra", external: false });
  eq(suggest(comPessoa)[0]?.question, "De que partes o Checkout é feito?", "depois vem a pergunta dos containers");

  const m = exampleModel();
  eq(
    suggest(m).map((s) => s.id),
    ["system-no-containers:erp", "orphan:auditor", "orphan:worker"],
    "sugestões do modelo de exemplo",
  );
  eq(suggest(m).length, 3, "nada além disso pendente no exemplo");

  eq(suggest(vazio)[0]?.issue, "nenhum sistema no modelo", "o issue do modelo vazio");
  eq(suggest(comSistema)[0]?.issue, "Checkout não tem quem use", "issue de sistema sem pessoa");
  eq(
    suggest(m).map((s) => s.issue),
    ["ERP não tem containers", "Auditor não conversa com ninguém", "Worker não conversa com ninguém"],
    "issues do modelo de exemplo",
  );

  const semErp = dismiss(m, "system-no-containers:erp");
  eq(suggest(semErp)[0]?.id, "orphan:auditor", "dispensar tira a sugestão da fila");
  eq(
    suggest(dismiss(semErp, "orphan:auditor"))[0]?.id,
    "orphan:worker",
    "dispensar de novo avança para a próxima",
  );

  // sistema cujas ligações foram declaradas só no nível de container não é órfão
  eq(
    suggest(m).some((s) => s.id === "orphan:checkout"),
    false,
    "órfão olha os descendentes",
  );
}
