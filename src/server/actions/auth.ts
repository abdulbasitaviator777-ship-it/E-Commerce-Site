"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSession, destroySession, destroyAllSessions } from "@/lib/auth";
import { hashPassword, verifyPassword, generateToken, hashToken } from "@/lib/crypto";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@/lib/validation";
import { rateLimit, clientKey } from "@/lib/rate-limit";
import { mergeGuestCartIntoUser } from "@/server/actions/cart";
import { sendVerificationEmail, sendPasswordResetEmail } from "@/lib/email";

export type AuthResult =
  | { ok: true; message?: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

function fieldErrors(result: {
  error: { issues: readonly { path: readonly PropertyKey[]; message: string }[] };
}): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] = issue.message;
  }
  return out;
}

// Only allow same-origin relative paths for post-login redirects.
function safeNext(value: unknown): string | null {
  if (typeof value !== "string") return null;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return null;
  }
  return value;
}

export async function registerAction(input: unknown): Promise<AuthResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Please fix the errors below.", fieldErrors: fieldErrors(parsed) };
  }
  const { name, email, password } = parsed.data;

  const limit = await rateLimit(await clientKey("register"), 5, 15 * 60 * 1000);
  if (!limit.success) return { ok: false, message: "Too many attempts. Please try again later." };

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    return { ok: false, message: "An account with this email already exists.", fieldErrors: { email: "Email already in use" } };
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { name, email: email.toLowerCase(), passwordHash, role: "CUSTOMER" },
  });

  const rawToken = generateToken(24);
  await prisma.emailVerificationToken.create({
    data: {
      hashedToken: hashToken(rawToken),
      userId: user.id,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });
  await sendVerificationEmail(email, rawToken);

  await createSession(user.id);
  await mergeGuestCartIntoUser(user.id);
  redirect("/account");
}

export async function loginAction(input: unknown): Promise<AuthResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Please fix the errors below.", fieldErrors: fieldErrors(parsed) };
  }
  const { email, password } = parsed.data;

  const limit = await rateLimit(await clientKey("login"), 10, 15 * 60 * 1000);
  if (!limit.success) return { ok: false, message: "Too many attempts. Please try again later." };

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  const generic = { ok: false as const, message: "Invalid email or password." };
  if (!user) return generic;
  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return generic;

  await createSession(user.id);
  await mergeGuestCartIntoUser(user.id);
  const next = safeNext((input as { next?: unknown })?.next);
  redirect(next ?? (user.role === "ADMIN" ? "/admin" : "/account"));
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/");
}

export async function forgotPasswordAction(input: unknown): Promise<AuthResult> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Please fix the errors below.", fieldErrors: fieldErrors(parsed) };
  }
  const { email } = parsed.data;

  const limit = await rateLimit(await clientKey("forgot"), 5, 15 * 60 * 1000);
  if (!limit.success) return { ok: false, message: "Too many attempts. Please try again later." };

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  // Always report success to avoid account enumeration.
  if (user) {
    const rawToken = generateToken(24);
    await prisma.passwordResetToken.create({
      data: {
        hashedToken: hashToken(rawToken),
        userId: user.id,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });
    await sendPasswordResetEmail(email, rawToken);
  }
  return { ok: true, message: "If an account exists, a reset link has been sent." };
}

export async function resetPasswordAction(input: unknown): Promise<AuthResult> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Please fix the errors below.", fieldErrors: fieldErrors(parsed) };
  }
  const { token, password } = parsed.data;
  const hashed = hashToken(token);
  const record = await prisma.passwordResetToken.findUnique({ where: { hashedToken: hashed } });
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return { ok: false, message: "This reset link is invalid or has expired." };
  }

  const passwordHash = await hashPassword(password);
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
  ]);
  await destroyAllSessions(record.userId);
  return { ok: true, message: "Password updated. You can now sign in." };
}

export async function verifyEmailAction(token: string): Promise<AuthResult> {
  const hashed = hashToken(token);
  const record = await prisma.emailVerificationToken.findUnique({ where: { hashedToken: hashed } });
  if (!record || record.verifiedAt || record.expiresAt < new Date()) {
    return { ok: false, message: "This verification link is invalid or has expired." };
  }
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { emailVerified: new Date() } }),
    prisma.emailVerificationToken.update({ where: { id: record.id }, data: { verifiedAt: new Date() } }),
  ]);
  return { ok: true, message: "Email verified. Thank you!" };
}

