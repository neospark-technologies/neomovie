import crypto from "crypto";

const SECRET =
  process.env.STREAM_PROXY_SECRET ||
  process.env.AIOSTREAMS_BASE_URL ||
  "neomovie_internal_vault_secure_stream_cipher_key_2026";

const KEY = crypto.createHash("sha256").update(SECRET).digest();

/**
 * Encrypts a private stream URL into an opaque, URL-safe token.
 * Prevents any visitors, inspect tools, or client JS from extracting private debrid tokens.
 */
export function encryptStreamToken(streamUrl: string): string {
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv("aes-256-cbc", KEY, iv);
    let encrypted = cipher.update(streamUrl, "utf8", "hex");
    encrypted += cipher.final("hex");
    return `${iv.toString("hex")}-${encrypted}`;
  } catch (err) {
    console.error("Token encryption error:", err);
    return "";
  }
}

/**
 * Decrypts a secure stream token back to the actual upstream playback URL.
 * Executed exclusively on the Next.js server runtime.
 */
export function decryptStreamToken(token: string): string | null {
  try {
    const parts = token.split("-");
    if (parts.length !== 2) return null;

    const [ivHex, dataHex] = parts;
    const iv = Buffer.from(ivHex, "hex");
    const decipher = crypto.createDecipheriv("aes-256-cbc", KEY, iv);
    let decrypted = decipher.update(dataHex, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (err) {
    console.error("Token decryption failed (tampered or invalid):", err);
    return null;
  }
}
