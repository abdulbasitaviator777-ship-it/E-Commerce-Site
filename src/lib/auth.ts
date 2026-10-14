import { cookies, headers } from "next/headers";
import { cache } from "react";
import type { User } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { generateToken, hashToken } from "@/lib/crypto";
import { isAdmin, type Role } from "@/lib/constants";

const SESSION_COOKIE = "ns_session";
const GUEST_CART_COOKIE = "ns_guest_cart";
const SESSION_TTL_DAYS = 30;

export type SessionUser = {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  emailVerified: boolean;
};

function sessionExpiry(): Date {
  return new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
}

// Create a new session for a user and set the session cookie.
export async function createSession(
  userId: string,
): Promise<void> {
  const rawToken = generateToken(32);
  const hashed = hashToken(rawToken);
  const h = await headers();
  const userAgent = h.get("user-agent")?.slice(0, 255) ?? null;
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    null;

  await prisma.session.create({
    data: {
      hashedToken: hashed,
      userId,
      expiresAt: sessionExpiry(),
      userAgent,
      ip,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, rawToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_DAYS * 24 * 60 * 60,
    domain: process.env.COOKIE_DOMAIN || undefined,
  });
}

// Resolve the current user from the session cookie, or null.
export const getCurrentUser = cache(
  async (): Promise<SessionUser | null> => {
    const cookieStore = await cookies();
    const raw = cookieStore.get(SESSION_COOKIE)?.value;
    if (!raw) return null;

    const hashed = hashToken(raw);
    const session = await prisma.session.findUnique({
      where: { hashedToken: hashed },
      include: { user: true },
    });
    if (!session) return null;
    if (session.expiresAt.getTime() < Date.now()) {
      await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
      return null;
    }
    return toSessionUser(session.user);
  },
);

// Alias used in server components/actions.
export async function getUser(): Promise<SessionUser | null> {
  return getCurrentUser();
}

export function toSessionUser(user: User): SessionUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as Role,
    emailVerified: user.emailVerified !== null,
  };
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  if (raw) {
    const hashed = hashToken(raw);
    await prisma.session.deleteMany({ where: { hashedToken: hashed } });
  }
  cookieStore.delete(SESSION_COOKIE);
}

// Invalidate all sessions for a user (e.g. after password change).
export async function destroyAllSessions(userId: string): Promise<void> {
  await prisma.session.deleteMany({ where: { userId } });
}

// --- Guest cart identity ---------------------------------------------------

export async function getGuestToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(GUEST_CART_COOKIE)?.value ?? null;
}

export async function ensureGuestToken(): Promise<string> {
  const cookieStore = await cookies();
  const existing = cookieStore.get(GUEST_CART_COOKIE)?.value;
  if (existing) return existing;
  const token = generateToken(24);
  cookieStore.set(GUEST_CART_COOKIE, hashToken(token), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 24 * 60 * 60,
    domain: process.env.COOKIE_DOMAIN || undefined,
  });
  return hashToken(token);
}

// --- Authorization guards (server-side, throw on failure) ------------------

export class AuthError extends Error {
  constructor(message = "Not authenticated") {
    super(message);
    this.name = "AuthError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new AuthError();
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new AuthError();
  if (!isAdmin(user.role)) throw new ForbiddenError();
  return user;
}

export function assertSameUser(
  sessionUser: SessionUser,
  ownerId: string | null | undefined,
): void {
  if (!ownerId || sessionUser.id !== ownerId) {
    throw new ForbiddenError("You do not have access to this resource.");
  }
}
