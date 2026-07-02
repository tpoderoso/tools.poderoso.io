/** UTF-8-safe Base64 encode (goes through TextEncoder so multi-byte chars don't break `btoa`). Returns a `// Erro:` string instead of throwing. */
export function b64Encode(s: string): string {
  try {
    const bytes = new TextEncoder().encode(s);
    let bin = "";
    bytes.forEach((b) => (bin += String.fromCharCode(b)));
    return btoa(bin);
  } catch (e) {
    return "// Erro: " + (e as Error).message;
  }
}

/** Inverse of {@link b64Encode}. Strips whitespace before decoding; returns a `// Erro:` string instead of throwing. */
export function b64Decode(s: string): string {
  try {
    const bin = atob(s.trim().replace(/\s/g, ""));
    const bytes = new Uint8Array([...bin].map((c) => c.charCodeAt(0)));
    return new TextDecoder().decode(bytes);
  } catch (e) {
    return "// Erro: " + (e as Error).message;
  }
}
