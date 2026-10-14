import bcrypt from "bcryptjs";
import crypto from "node:crypto";

// Password hashing with bcrypt (secure, adaptive cost factor).
const BCRYPT_ROUNDS = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export async function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// Generate a cryptographically secure random token (raw, returned to caller).
export function generateToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("base64url");
}

// Hash a token for storage (SHA-256). We only ever store the hash; the raw
// token is delivered via cookie or link and compared by hashing again.
export function hashToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

// Deterministic HMAC for signing values (e.g. cookie integrity) using the
// app secret. Not a substitute for token hashing.
export function hmac(value: string): string {
  const secret = getAuthSecret();
  return crypto.createHmac("sha256", secret).update(value).digest("hex");
}

export function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "AUTH_SECRET is missing or too short. Set a long random value in the environment.",
      );
    }
    // In development, use a stable fallback so the app boots without config.
    return "dev-only-insecure-secret-change-me-0000000000";
  }
  return secret;
}

// Constant-time comparison to avoid timing attacks.
export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}
