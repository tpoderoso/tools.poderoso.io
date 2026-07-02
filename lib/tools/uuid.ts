export type UuidVersion = "v3" | "v4" | "v5" | "v6" | "v7";

export const UUID_VERSIONS: UuidVersion[] = ["v3", "v4", "v5", "v6", "v7"];
export const DNS_NAMESPACE = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";

function bytesToUuid(bytes: Uint8Array): string {
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function parseUuidToBytes(uuid: string): Uint8Array {
  const hex = uuid.trim().replace(/-/g, "");
  if (!/^[0-9a-f]{32}$/i.test(hex)) throw new Error("Namespace inválido — use um UUID no formato xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx");
  const bytes = new Uint8Array(16);
  for (let i = 0; i < 16; i++) bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return bytes;
}

function concatBytes(a: Uint8Array, b: Uint8Array): Uint8Array {
  const out = new Uint8Array(a.length + b.length);
  out.set(a);
  out.set(b, a.length);
  return out;
}

function leftRotate(x: number, c: number): number {
  return (x << c) | (x >>> (32 - c));
}

// Minimal MD5 (RFC 1321) — needed for UUIDv3; the Web Crypto API only offers SHA-*.
function md5(input: Uint8Array): Uint8Array {
  const s = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
    5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
    4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
  ];
  const K = new Int32Array(64);
  for (let i = 0; i < 64; i++) K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 2 ** 32) | 0;

  let a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476;

  const msgLen = input.length;
  let paddedLen = msgLen + 1;
  while (paddedLen % 64 !== 56) paddedLen++;
  paddedLen += 8;
  const msg = new Uint8Array(paddedLen);
  msg.set(input);
  msg[msgLen] = 0x80;
  const dv = new DataView(msg.buffer);
  dv.setBigUint64(paddedLen - 8, BigInt(msgLen) * BigInt(8), true);

  for (let chunk = 0; chunk < paddedLen; chunk += 64) {
    const M = new Int32Array(16);
    for (let i = 0; i < 16; i++) M[i] = dv.getInt32(chunk + i * 4, true);

    let A = a0, B = b0, C = c0, D = d0;
    for (let i = 0; i < 64; i++) {
      let F: number, g: number;
      if (i < 16) { F = (B & C) | (~B & D); g = i; }
      else if (i < 32) { F = (D & B) | (~D & C); g = (5 * i + 1) % 16; }
      else if (i < 48) { F = B ^ C ^ D; g = (3 * i + 5) % 16; }
      else { F = C ^ (B | ~D); g = (7 * i) % 16; }
      F = (F + A + K[i] + M[g]) | 0;
      A = D; D = C; C = B;
      B = (B + leftRotate(F, s[i])) | 0;
    }
    a0 = (a0 + A) | 0; b0 = (b0 + B) | 0; c0 = (c0 + C) | 0; d0 = (d0 + D) | 0;
  }

  const out = new Uint8Array(16);
  new DataView(out.buffer).setInt32(0, a0, true);
  new DataView(out.buffer).setInt32(4, b0, true);
  new DataView(out.buffer).setInt32(8, c0, true);
  new DataView(out.buffer).setInt32(12, d0, true);
  return out;
}

function genUUIDv4(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function genUUIDv7(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const ts = BigInt(Date.now());
  const mask = BigInt(0xff);
  for (let i = 0; i < 6; i++) bytes[i] = Number((ts >> BigInt(40 - i * 8)) & mask);
  bytes[6] = (bytes[6] & 0x0f) | 0x70;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  return bytesToUuid(bytes);
}

// 100ns intervals between the Gregorian epoch (1582-10-15) and the Unix epoch.
const GREGORIAN_OFFSET_100NS = BigInt("122192928000000000");

function genUUIDv6(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const sixty = (BigInt(1) << BigInt(60)) - BigInt(1);
  const t60 =
    (BigInt(Date.now()) * BigInt(10000) + GREGORIAN_OFFSET_100NS + BigInt(Math.floor(Math.random() * 10000))) &
    sixty;
  const timeHigh = t60 >> BigInt(28);
  const timeMid = (t60 >> BigInt(12)) & BigInt(0xffff);
  const timeLow = t60 & BigInt(0xfff);
  bytes[0] = Number((timeHigh >> BigInt(24)) & BigInt(0xff));
  bytes[1] = Number((timeHigh >> BigInt(16)) & BigInt(0xff));
  bytes[2] = Number((timeHigh >> BigInt(8)) & BigInt(0xff));
  bytes[3] = Number(timeHigh & BigInt(0xff));
  bytes[4] = Number((timeMid >> BigInt(8)) & BigInt(0xff));
  bytes[5] = Number(timeMid & BigInt(0xff));
  bytes[6] = 0x60 | Number((timeLow >> BigInt(8)) & BigInt(0x0f));
  bytes[7] = Number(timeLow & BigInt(0xff));
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  return bytesToUuid(bytes);
}

function genUUIDv3(namespace: string, name: string): string {
  const data = concatBytes(parseUuidToBytes(namespace), new TextEncoder().encode(name));
  const hash = md5(data);
  hash[6] = (hash[6] & 0x0f) | 0x30;
  hash[8] = (hash[8] & 0x3f) | 0x80;
  return bytesToUuid(hash);
}

async function genUUIDv5(namespace: string, name: string): Promise<string> {
  const data = concatBytes(parseUuidToBytes(namespace), new TextEncoder().encode(name));
  const hashBuf = await crypto.subtle.digest("SHA-1", data as BufferSource);
  const hash = new Uint8Array(hashBuf).slice(0, 16);
  hash[6] = (hash[6] & 0x0f) | 0x50;
  hash[8] = (hash[8] & 0x3f) | 0x80;
  return bytesToUuid(hash);
}

/**
 * Generates a UUID of the given version. `namespace`/`name` are only used by v3/v5 (name-based, deterministic
 * for the same inputs); v4/v6/v7 ignore them. v3 uses a hand-rolled MD5 (Web Crypto has no MD5); v5 uses
 * `crypto.subtle` SHA-1.
 */
export async function genUUID(version: UuidVersion, namespace: string = DNS_NAMESPACE, name: string = ""): Promise<string> {
  switch (version) {
    case "v3": return genUUIDv3(namespace, name);
    case "v5": return genUUIDv5(namespace, name);
    case "v6": return genUUIDv6();
    case "v7": return genUUIDv7();
    default: return genUUIDv4();
  }
}
