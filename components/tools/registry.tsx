import type { ReactNode } from "react";
import { ALL_TOOLS, toolHref } from "@/lib/nav";
import { JsonFormatter } from "./JsonFormatter";
import { JsonValidator } from "./JsonValidator";
import { JsonTreeViewer } from "./JsonTreeViewer";
import { XmlFormatter } from "./XmlFormatter";
import { SqlFormatter } from "./SqlFormatter";
import { XsdValidator } from "./XsdValidator";
import { CpfGenerator } from "./CpfGenerator";
import { CnpjGenerator } from "./CnpjGenerator";
import { CompanyGenerator } from "./CompanyGenerator";
import { PessoaGenerator } from "./PessoaGenerator";
import { UuidGenerator } from "./UuidGenerator";
import { PasswordGenerator } from "./PasswordGenerator";
import { LoremGenerator } from "./LoremGenerator";
import { QrCodeGenerator } from "./QrCodeGenerator";
import { Base64TextTool } from "./Base64TextTool";
import { Base64ImageTool } from "./Base64ImageTool";
import { JwtDecoder } from "./JwtDecoder";
import { EpochConverter } from "./EpochConverter";
import { TextDiffTool } from "./TextDiffTool";
import { TextToolkit } from "./TextToolkit";

/**
 * slug ("category/tool") -> painel da ferramenta. Chave = toolHref(item) sem
 * a barra inicial. Geradores montam sempre ativos (`active`) pra gerar o valor
 * inicial no load.
 */
export const TOOL_REGISTRY: Record<string, () => ReactNode> = {
  "format/json": () => <JsonFormatter />,
  "format/json-validate": () => <JsonValidator />,
  "format/json-tree": () => <JsonTreeViewer />,
  "format/xml": () => <XmlFormatter />,
  "format/sql": () => <SqlFormatter />,
  "format/xsdval": () => <XsdValidator />,
  "generate/cpf": () => <CpfGenerator active />,
  "generate/cnpj": () => <CnpjGenerator active />,
  "generate/empresa": () => <CompanyGenerator active />,
  "generate/pessoa": () => <PessoaGenerator active />,
  "generate/uuid": () => <UuidGenerator active />,
  "generate/senha": () => <PasswordGenerator active />,
  "generate/lorem": () => <LoremGenerator active />,
  "generate/qr": () => <QrCodeGenerator active />,
  "encode/base64": () => <Base64TextTool />,
  "encode/base64-img": () => <Base64ImageTool />,
  "encode/jwt": () => <JwtDecoder />,
  "convert/epoch": () => <EpochConverter active />,
  "texto/ferramentas": () => <TextToolkit />,
  "diff/text": () => <TextDiffTool />,
};

// ponytail: self-check — toda tool tem rota e nenhuma rota é órfã. Roda no
// import (build/dev), então uma tool nova sem entrada quebra cedo, não em runtime.
if (process.env.NODE_ENV !== "production") {
  const slugs = new Set(ALL_TOOLS.map((t) => toolHref(t).slice(1)));
  for (const s of slugs) {
    if (!TOOL_REGISTRY[s]) throw new Error(`registry: falta rota para "${s}"`);
  }
  for (const k of Object.keys(TOOL_REGISTRY)) {
    if (!slugs.has(k)) throw new Error(`registry: rota órfã "${k}"`);
  }
}
