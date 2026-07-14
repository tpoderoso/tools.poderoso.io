export interface SchemaFile {
  name: string;
  content: string;
}

export interface XsdError {
  line?: number;
  message: string;
}

export type XsdResult = { valid: true } | { valid: false; errors: XsdError[] };

/** Schema que nenhum outro importa/inclui (raiz da árvore); fallback: o primeiro enviado. */
export function detectMainSchema(schemas: SchemaFile[]): string {
  const referenced = new Set<string>();
  for (const schema of schemas) {
    for (const match of schema.content.matchAll(/schemaLocation\s*=\s*["']([^"']+)["']/g)) {
      referenced.add(match[1]);
    }
  }
  const root = schemas.find((s) => !referenced.has(s.name));
  return (root ?? schemas[0]).name;
}

export async function validateXml(
  xml: string,
  schemas: SchemaFile[],
  mainSchemaName: string,
): Promise<XsdResult> {
  const main = schemas.find((s) => s.name === mainSchemaName);
  if (!main) throw new Error(`Schema principal "${mainSchemaName}" não encontrado`);

  const { validateXML } = await import("xmllint-wasm");
  const preload = schemas
    .filter((s) => s.name !== mainSchemaName)
    .map((s) => ({ fileName: s.name, contents: s.content }));

  try {
    const result = await validateXML({
      xml: [{ fileName: "input.xml", contents: xml }],
      schema: [main.content],
      preload,
    });
    if (result.valid) return { valid: true };
    return {
      valid: false,
      errors: result.errors.map((e) => ({ line: e.loc?.lineNumber, message: e.message })),
    };
  } catch (e) {
    return { valid: false, errors: [{ message: `Erro no schema XSD: ${(e as Error).message}` }] };
  }
}

/** Só boa-formação, sem schema — usa DOMParser nativo, não carrega o WASM. */
export function checkWellFormedness(xml: string): XsdResult {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  const errorNode = doc.getElementsByTagName("parsererror")[0];
  if (!errorNode) return { valid: true };
  return { valid: false, errors: [{ message: errorNode.textContent?.trim() || "XML mal-formado" }] };
}

/** "999 B", "1.5 KB", "3.4 MB" — pra lista de schemas. */
export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
