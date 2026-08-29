import { ImageResponse } from "next/og";
import { ALL_TOOLS, toolHref, toolTitle } from "@/lib/nav";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Ferramenta online e gratuita do tools.poderoso.io";

/** Uma imagem por ferramenta, geradas no build junto com as páginas. */
export function generateStaticParams() {
  return ALL_TOOLS.map((t) => {
    const [category, tool] = toolHref(t).slice(1).split("/");
    return { category, tool };
  });
}

/**
 * Card que aparece quando o link da ferramenta é colado no WhatsApp, Slack ou
 * LinkedIn. Sem a imagem por rota, todas as ferramentas herdariam o card genérico
 * da home. Mesma janela de terminal da tela, pra quem clica reconhecer onde caiu.
 */
export default async function ToolOgImage({
  params,
}: {
  params: Promise<{ category: string; tool: string }>;
}) {
  const { category, tool } = await params;
  const item = ALL_TOOLS.find((t) => toolHref(t) === `/${category}/${tool}`);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: 64,
          background: "#21222c",
          fontFamily: "monospace",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            border: "1px solid #44475a",
            borderRadius: 20,
            background: "#191a21",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "0 28px",
              height: 64,
              borderBottom: "1px solid #343746",
            }}
          >
            <span style={{ width: 16, height: 16, borderRadius: 8, background: "#ff5555" }} />
            <span style={{ width: 16, height: 16, borderRadius: 8, background: "#f1fa8c" }} />
            <span style={{ width: 16, height: 16, borderRadius: 8, background: "#50fa7b" }} />
            <div style={{ display: "flex", marginLeft: 16, fontSize: 22 }}>
              <span style={{ color: "#50fa7b" }}>tools</span>
              <span style={{ color: "#6272a4" }}>.</span>
              <span style={{ color: "#8be9fd" }}>poderoso</span>
              <span style={{ color: "#6272a4" }}>.io</span>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: 26,
              flex: 1,
              padding: "0 56px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", fontSize: 26 }}>
              <span style={{ color: "#6272a4" }}>~/</span>
              <span style={{ color: "#8be9fd" }}>{category}</span>
              <span style={{ color: "#6272a4" }}>/</span>
              <span style={{ color: "#50fa7b" }}>{tool}</span>
              <span style={{ width: 12, height: 28, marginLeft: 8, background: "#50fa7b" }} />
            </div>
            <div style={{ display: "flex", fontSize: 62, color: "#f8f8f2", lineHeight: 1.15 }}>
              {item ? toolTitle(item) : "Ferramenta online"}
            </div>
            <div style={{ display: "flex", fontSize: 30, color: "#9aa0bf" }}>
              {item?.description ?? "Roda no navegador, sem cadastro."}
            </div>
            <div style={{ display: "flex", fontSize: 24, color: "#bd93f9" }}>
              gratuita · sem cadastro · roda no seu navegador
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
