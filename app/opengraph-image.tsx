import { ImageResponse } from "next/og";
import { ALL_TOOLS } from "@/lib/nav";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "tools.poderoso.io · ferramentas online para desenvolvedores";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 24,
          padding: 80,
          background: "#21222c",
          color: "#f8f8f2",
          fontFamily: "monospace",
        }}
      >
        <div style={{ display: "flex", gap: 12 }}>
          <span style={{ width: 20, height: 20, borderRadius: 10, background: "#ff5555" }} />
          <span style={{ width: 20, height: 20, borderRadius: 10, background: "#f1fa8c" }} />
          <span style={{ width: 20, height: 20, borderRadius: 10, background: "#50fa7b" }} />
        </div>
        <div style={{ display: "flex", fontSize: 68 }}>
          <span style={{ color: "#50fa7b" }}>tools</span>
          <span style={{ color: "#6272a4" }}>.</span>
          <span style={{ color: "#8be9fd" }}>poderoso</span>
          <span style={{ color: "#6272a4" }}>.io</span>
        </div>
        <div style={{ display: "flex", fontSize: 34, color: "#9aa0bf", maxWidth: 900 }}>
          Formatadores, geradores e conversores para devs. Roda no navegador, sem cadastro.
        </div>
        <div style={{ display: "flex", fontSize: 26, color: "#bd93f9" }}>
          {`${ALL_TOOLS.length} ferramentas · JSON · XML · SQL · CPF · CNPJ · UUID · Base64 · JWT`}
        </div>
      </div>
    ),
    size
  );
}
