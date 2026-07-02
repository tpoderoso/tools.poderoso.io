export interface JwtResult {
  header: string;
  payload: string;
  err: string;
}

/** Decodes a JWT's header and payload for display. Does NOT verify the signature — this is a reader, not a validator. */
export function decodeJWT(token: string): JwtResult {
  const t = token.trim();
  if (!t) return { header: "", payload: "", err: "" };
  const parts = t.split(".");
  if (parts.length !== 3) {
    return { header: "", payload: "", err: "// JWT inválido — esperado formato: header.payload.signature" };
  }
  try {
    const b64url = (str: string) => {
      let r = str.replace(/-/g, "+").replace(/_/g, "/");
      while (r.length % 4) r += "=";
      const bin = atob(r);
      const bytes = new Uint8Array([...bin].map((c) => c.charCodeAt(0)));
      return JSON.parse(new TextDecoder().decode(bytes));
    };
    return {
      header: JSON.stringify(b64url(parts[0]), null, 2),
      payload: JSON.stringify(b64url(parts[1]), null, 2),
      err: "",
    };
  } catch (e) {
    return { header: "", payload: "", err: "// Erro ao decodificar: " + (e as Error).message };
  }
}
