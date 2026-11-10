import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

function key() {
  const secret = process.env.SHOPIFY_API_SECRET;
  if (!secret) throw new Error("Shopify app secret is unavailable");
  return createHash("sha256").update(secret).digest();
}

export function hashApiSecret(value) {
  return createHash("sha256").update(String(value).trim()).digest("hex");
}

export function createApiSecret() {
  return `shipflux_${randomBytes(24).toString("base64url")}`;
}

export function encryptApiSecret(value) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), encrypted]
    .map((part) => part.toString("base64url"))
    .join(".");
}

export function decryptApiSecret(value) {
  const [iv, tag, encrypted] = String(value).split(".").map((part) => Buffer.from(part, "base64url"));
  if (!iv || !tag || !encrypted) throw new Error("Stored API secret is invalid");
  const decipher = createDecipheriv("aes-256-gcm", key(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}
