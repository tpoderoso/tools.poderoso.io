import type { NextConfig } from "next";
import { CATEGORY_ENTRY } from "./lib/nav";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["better-sqlite3"],
  async redirects() {
    return [
      // /format, /generate e as outras categorias não têm página: mandam para a
      // primeira ferramenta em vez de devolver 404.
      ...Object.entries(CATEGORY_ENTRY).map(([category, href]) => ({
        source: `/${category}`,
        destination: href,
        permanent: true,
      })),
      // o validador e o visualizador viraram abas do /format/json. As duas rotas
      // já estavam indexadas, então saem com 301 em vez de 404.
      { source: "/format/json-validate", destination: "/format/json", permanent: true },
      { source: "/format/json-tree", destination: "/format/json", permanent: true },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.qrserver.com",
        pathname: "/v1/create-qr-code/**",
      },
    ],
  },
};

export default nextConfig;
