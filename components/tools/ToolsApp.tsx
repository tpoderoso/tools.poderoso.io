"use client";

import { useState, type ReactNode } from "react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Toaster } from "@/components/ui/Toaster";
import { DEFAULT_TOOL, type ToolId } from "@/lib/nav";
import { JsonFormatter } from "./JsonFormatter";
import { JsonValidator } from "./JsonValidator";
import { JsonTreeViewer } from "./JsonTreeViewer";
import { XmlFormatter } from "./XmlFormatter";
import { SqlFormatter } from "./SqlFormatter";
import { CpfGenerator } from "./CpfGenerator";
import { CnpjGenerator } from "./CnpjGenerator";
import { UuidGenerator } from "./UuidGenerator";
import { PasswordGenerator } from "./PasswordGenerator";
import { LoremGenerator } from "./LoremGenerator";
import { QrCodeGenerator } from "./QrCodeGenerator";
import { Base64TextTool } from "./Base64TextTool";
import { Base64ImageTool } from "./Base64ImageTool";
import { JwtDecoder } from "./JwtDecoder";
import { EpochConverter } from "./EpochConverter";
import { TextDiffTool } from "./TextDiffTool";

function Slot({ active, children }: { active: boolean; children: ReactNode }) {
  return <div style={{ display: active ? "contents" : "none" }}>{children}</div>;
}

export function ToolsApp() {
  const [tool, setTool] = useState<ToolId>(DEFAULT_TOOL);

  const fillRow = { display: "flex", flex: 1, overflow: "hidden" } as const;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: "var(--color-bg)",
        color: "var(--color-fg)",
      }}
    >
      <Header />
      <div style={fillRow}>
        <Sidebar active={tool} onSelect={setTool} />
        <div style={fillRow}>
          <Slot active={tool === "json"}>
            <JsonFormatter />
          </Slot>
          <Slot active={tool === "jsonval"}>
            <JsonValidator />
          </Slot>
          <Slot active={tool === "jsontree"}>
            <JsonTreeViewer />
          </Slot>
          <Slot active={tool === "xml"}>
            <XmlFormatter />
          </Slot>
          <Slot active={tool === "sql"}>
            <SqlFormatter />
          </Slot>
          <Slot active={tool === "cpf"}>
            <CpfGenerator active={tool === "cpf"} />
          </Slot>
          <Slot active={tool === "cnpj"}>
            <CnpjGenerator active={tool === "cnpj"} />
          </Slot>
          <Slot active={tool === "uuid"}>
            <UuidGenerator active={tool === "uuid"} />
          </Slot>
          <Slot active={tool === "pwd"}>
            <PasswordGenerator active={tool === "pwd"} />
          </Slot>
          <Slot active={tool === "lorem"}>
            <LoremGenerator active={tool === "lorem"} />
          </Slot>
          <Slot active={tool === "qr"}>
            <QrCodeGenerator active={tool === "qr"} />
          </Slot>
          <Slot active={tool === "b64"}>
            <Base64TextTool />
          </Slot>
          <Slot active={tool === "b64img"}>
            <Base64ImageTool />
          </Slot>
          <Slot active={tool === "jwt"}>
            <JwtDecoder />
          </Slot>
          <Slot active={tool === "epoch"}>
            <EpochConverter active={tool === "epoch"} />
          </Slot>
          <Slot active={tool === "diff"}>
            <TextDiffTool />
          </Slot>
        </div>
      </div>
      <Toaster />
    </div>
  );
}
