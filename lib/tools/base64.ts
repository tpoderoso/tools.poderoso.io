/** UTF-8-safe Base64 encode (goes through TextEncoder so multi-byte chars don't break `btoa`). Throws on failure (caller catches and toasts). */
export function b64Encode(s: string): string {
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin);
}

/** Inverse of {@link b64Encode}. Strips whitespace before decoding; throws on malformed Base64 (caller catches and toasts). */
export function b64Decode(s: string): string {
  const bin = atob(s.trim().replace(/\s/g, ""));
  const bytes = new Uint8Array([...bin].map((c) => c.charCodeAt(0)));
  return new TextDecoder().decode(bytes);
}
