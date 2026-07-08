export interface JwtResult {
  header: string;
  payload: string;
  err: string;
  /** exp/iat/nbf claims em epoch segundos, se presentes no payload. */
  exp?: number;
  iat?: number;
  nbf?: number;
}

/** Decodes a JWT's header and payload for display. Does NOT verify the signature — this is a reader, not a validator. */
export function decodeJWT(token: string): JwtResult {
  const t = token.trim();
  if (!t) return { header: "", payload: "", err: "" };
  const parts = t.split(".");
  if (parts.length !== 3) {
    return { header: "", payload: "", err: "JWT inválido — esperado formato: header.payload.signature" };
  }
  try {
    const b64url = (str: string) => {
      let r = str.replace(/-/g, "+").replace(/_/g, "/");
      while (r.length % 4) r += "=";
      const bin = atob(r);
      const bytes = new Uint8Array([...bin].map((c) => c.charCodeAt(0)));
      return JSON.parse(new TextDecoder().decode(bytes));
    };
    const payloadObj = b64url(parts[1]);
    return {
      header: JSON.stringify(b64url(parts[0]), null, 2),
      payload: JSON.stringify(payloadObj, null, 2),
      err: "",
      exp: typeof payloadObj?.exp === "number" ? payloadObj.exp : undefined,
      iat: typeof payloadObj?.iat === "number" ? payloadObj.iat : undefined,
      nbf: typeof payloadObj?.nbf === "number" ? payloadObj.nbf : undefined,
    };
  } catch (e) {
    return { header: "", payload: "", err: "Erro ao decodificar JWT: " + (e as Error).message };
  }
}

export type JwtLifecycle =
  | { state: "expired"; at: number }
  | { state: "not-yet-valid"; at: number }
  | { state: "valid"; expiresAt?: number }
  | { state: "unknown" };

/** Deriva o status temporal de um JWT a partir das claims exp/nbf, comparado a "now" (epoch ms, injetável para teste). */
export function jwtLifecycle({ exp, nbf }: Pick<JwtResult, "exp" | "nbf">, now = Date.now()): JwtLifecycle {
  if (nbf !== undefined && now < nbf * 1000) return { state: "not-yet-valid", at: nbf * 1000 };
  if (exp !== undefined && now >= exp * 1000) return { state: "expired", at: exp * 1000 };
  if (exp !== undefined) return { state: "valid", expiresAt: exp * 1000 };
  return { state: "unknown" };
}
