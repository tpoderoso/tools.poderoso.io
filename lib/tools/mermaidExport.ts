/** Dispara o download de um blob no navegador. */
export function downloadBlob(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

/** Rasteriza o SVG num PNG 2x (nitidez) sobre `bg`, resolvendo o blob. Rejeita se a imagem falhar. */
export function svgToPngBlob(svg: string, w: number, h: number, bg: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = 2;
      const canvas = document.createElement("canvas");
      canvas.width = w * scale;
      canvas.height = h * scale;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("sem contexto 2d"));
      ctx.scale(scale, scale);
      ctx.fillStyle = bg || "#21222c";
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob vazio"))), "image/png");
    };
    img.onerror = () => reject(new Error("falha ao carregar SVG"));
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svg)));
  });
}
