"use server";

import { prisma } from "@/lib/prisma";
import { newsletterSchema } from "@/lib/validation";

export async function subscribeNewsletter(input: unknown): Promise<{
  ok: boolean;
  message: string;
}> {
  const parsed = newsletterSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Please enter a valid email address." };
  }
  const email = parsed.data.email.toLowerCase();
  try {
    await prisma.newsletterSubscription.upsert({
      where: { email },
      create: { email },
      update: {},
    });
    return { ok: true, message: "Thanks for subscribing!" };
  } catch {
    return { ok: false, message: "Something went wrong. Please try again." };
  }
}
