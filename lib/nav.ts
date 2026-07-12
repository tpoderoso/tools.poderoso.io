export type ToolId =
  | "json"
  | "jsonval"
  | "jsontree"
  | "xml"
  | "sql"
  | "xsdval"
  | "cpf"
  | "cnpj"
  | "uuid"
  | "pwd"
  | "lorem"
  | "qr"
  | "b64"
  | "b64img"
  | "jwt"
  | "epoch"
  | "diff";

export interface NavItem {
  id: ToolId;
  label: string;
}

export interface NavGroup {
  heading: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    heading: "~/format",
    items: [
      { id: "json", label: "JSON Formatter" },
      { id: "jsonval", label: "JSON Validator" },
      { id: "jsontree", label: "JSON Viewer" },
      { id: "xml", label: "XML Formatter" },
      { id: "sql", label: "SQL Formatter" },
      { id: "xsdval", label: "XSD Validator" },
    ],
  },
  {
    heading: "~/generate",
    items: [
      { id: "cpf", label: "CPF" },
      { id: "cnpj", label: "CNPJ" },
      { id: "uuid", label: "UUID" },
      { id: "pwd", label: "Senha Segura" },
      { id: "lorem", label: "Lorem Ipsum" },
      { id: "qr", label: "QR Code" },
    ],
  },
  {
    heading: "~/encode",
    items: [
      { id: "b64", label: "Base64 Texto" },
      { id: "b64img", label: "Base64 Imagem" },
      { id: "jwt", label: "JWT Decoder" },
    ],
  },
  {
    heading: "~/convert",
    items: [{ id: "epoch", label: "Epoch / Timezone" }],
  },
  {
    heading: "~/diff",
    items: [{ id: "diff", label: "Text Diff" }],
  },
];

export const DEFAULT_TOOL: ToolId = "json";
