import type { C4Element } from "./model.ts";

export type Shape =
  | "default"
  | "person"
  | "database"
  | "queue"
  | "browser"
  | "mobile"
  | "cli"
  | "folder"
  | "blob";

/**
 * Palavras-chave por forma. A ORDEM IMPORTA e não é estética: "React Native"
 * casa com `react` (browser) e com `react native` (mobile). Testar `mobile`
 * antes de `browser` é o que faz o app mobile não virar janela de SPA.
 */
const KEYWORDS: readonly (readonly [Shape, readonly string[]])[] = [
  ["database", ["postgres", "mysql", "mariadb", "mongo", "redis", "oracle", "sqlserver", "sql server", "dynamo", "cassandra", "elastic", "sqlite"]],
  ["queue", ["kafka", "sqs", "rabbit", "pubsub", "pub/sub", "nats", "sns", "event hub", "kinesis"]],
  ["blob", ["s3", "bucket", "blob", "gcs", "cloud storage", "minio"]],
  ["mobile", ["react native", "ios", "android", "flutter", "swift", "kotlin", "mobile"]],
  ["browser", ["react", "next", "vue", "angular", "svelte", "single-page"]],
  ["cli", ["cli", "cron", "worker", "batch", "daemon", "shell", "console"]],
  ["folder", ["ldap", "active directory", "file system", "filesystem", "nfs"]],
];

const SHAPES = new Set<string>([
  "default", "person", "database", "queue", "browser", "mobile", "cli", "folder", "blob",
]);

/** Rótulos pt-BR do seletor de forma no formulário. */
export const SHAPE_OPTIONS: readonly { value: Shape; label: string }[] = [
  { value: "default", label: "padrão" },
  { value: "database", label: "banco de dados" },
  { value: "queue", label: "fila" },
  { value: "browser", label: "janela (SPA)" },
  { value: "mobile", label: "app mobile" },
  { value: "cli", label: "terminal" },
  { value: "folder", label: "pasta" },
  { value: "blob", label: "bucket" },
];

/**
 * Forma da caixa, em ordem de prioridade: pessoa é sempre boneco, depois a tag
 * explícita, depois o palpite pela tecnologia. `tags` já existia no modelo
 * (com este propósito documentado) e nunca tinha sido lido por ninguém.
 */
export function shapeFor(el: Pick<C4Element, "kind" | "technology" | "tags">): Shape {
  if (el.kind === "person") return "person";

  const tag = el.tags?.[0];
  if (tag && SHAPES.has(tag) && tag !== "person") return tag as Shape;

  const tech = el.technology?.toLowerCase() ?? "";
  if (tech) for (const [shape, words] of KEYWORDS) if (words.some((w) => tech.includes(w))) return shape;

  return "default";
}

// ponytail: self-check — roda no import (dev/build) e via `node lib/tools/c4/shape.ts`
if (process.env.NODE_ENV !== "production") {
  const eq = (got: unknown, exp: unknown, what: string) => {
    if (got !== exp) throw new Error(`c4/shape ${what}: got ${JSON.stringify(got)} exp ${JSON.stringify(exp)}`);
  };
  const c = (technology?: string, tags?: string[]) => ({ kind: "container" as const, technology, tags });

  eq(shapeFor(c("Postgres 16")), "database", "tecnologia deduz banco");
  eq(shapeFor(c("React Native")), "mobile", "mobile ganha de browser na ordem");
  eq(shapeFor(c("React 19")), "browser", "react puro ainda é janela");
  eq(shapeFor(c("Amazon S3")), "blob", "bucket pela tecnologia");
  eq(shapeFor(c("Postgres", ["queue"])), "queue", "tag ganha da dedução");
  eq(shapeFor(c("Postgres", ["banana"])), "database", "tag inválida cai na dedução");
  eq(shapeFor({ kind: "person", technology: "Postgres", tags: ["database"] }), "person", "pessoa não é negociável");
  eq(shapeFor(c("Elixir")), "default", "tecnologia desconhecida vira padrão");
  eq(shapeFor(c()), "default", "sem tecnologia vira padrão");
  eq(shapeFor(c(undefined, ["person"])), "default", "tag 'person' não se aplica a container");
  eq(shapeFor(c("TypeScript")), "default", "TypeScript não é terminal");
  eq(shapeFor(c("JavaScript")), "default", "JavaScript não é terminal");
  eq(shapeFor(c("Apache Spark")), "default", "Spark não é browser (evitar 'spa' por substring)");
}
