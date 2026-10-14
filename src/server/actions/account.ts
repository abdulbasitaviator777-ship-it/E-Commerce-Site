"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, destroySession } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/crypto";
import { nameSchema, addressSchema, passwordSchema } from "@/lib/validation";
import { redirect } from "next/navigation";

export type AccountResult =
  | { ok: true; message: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

function issues(result: {
  error: { issues: readonly { path: readonly PropertyKey[]; message: string }[] };
}): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of result.error.issues) {
    out[String(issue.path[0] ?? "form")] = issue.message;
  }
  return out;
}

const profileSchema = z.object({ name: nameSchema });

const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Enter your current password"),
  newPassword: passwordSchema,
});

export async function updateProfileAction(input: unknown): Promise<AccountResult> {
  const user = await requireUser();
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Check the form.", fieldErrors: issues(parsed) };
  }
  await prisma.user.update({
    where: { id: user.id },
    data: { name: parsed.data.name },
  });
  revalidatePath("/account");
  return { ok: true, message: "Profile updated." };
}

export async function changePasswordAction(input: unknown): Promise<AccountResult> {
  const user = await requireUser();
  const parsed = passwordChangeSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Check the form.", fieldErrors: issues(parsed) };
  }

  const record = await prisma.user.findUnique({ where: { id: user.id } });
  if (!record) return { ok: false, message: "Account not found." };

  const valid = await verifyPassword(parsed.data.currentPassword, record.passwordHash);
  if (!valid) {
    return {
      ok: false,
      message: "Current password is incorrect.",
      fieldErrors: { currentPassword: "Incorrect password" },
    };
  }

  const passwordHash = await hashPassword(parsed.data.newPassword);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
  return { ok: true, message: "Password changed." };
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/");
}

// --- Address book ----------------------------------------------------------

const addressInputSchema = z.object({
  fullName: addressSchema.shape.fullName,
  phone: addressSchema.shape.phone,
  line1: addressSchema.shape.line1,
  line2: addressSchema.shape.line2,
  city: addressSchema.shape.city,
  state: addressSchema.shape.state,
  postalCode: addressSchema.shape.postalCode,
  country: addressSchema.shape.country,
  isDefault: z.boolean().optional(),
});

export async function saveAddressAction(input: unknown): Promise<AccountResult> {
  const user = await requireUser();
  const parsed = addressInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Check the address form.", fieldErrors: issues(parsed) };
  }

  const count = await prisma.address.count({ where: { userId: user.id } });
  if (count >= 10) {
    return { ok: false, message: "Address book limit reached (10)." };
  }

  const data = {
    fullName: parsed.data.fullName,
    phone: parsed.data.phone,
    line1: parsed.data.line1,
    line2: parsed.data.line2 || null,
    city: parsed.data.city,
    state: parsed.data.state || null,
    postalCode: parsed.data.postalCode,
    country: parsed.data.country,
    isDefault: parsed.data.isDefault ?? count === 0,
  };

  const id = (input as { id?: string }).id;
  if (id) {
    const existing = await prisma.address.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) return { ok: false, message: "Address not found." };
    await prisma.address.update({ where: { id }, data });
    if (data.isDefault) {
      await prisma.address.updateMany({
        where: { userId: user.id, NOT: { id } },
        data: { isDefault: false },
      });
    }
  } else {
    const created = await prisma.address.create({
      data: { ...data, userId: user.id },
    });
    if (data.isDefault) {
      await prisma.address.updateMany({
        where: { userId: user.id, NOT: { id: created.id } },
        data: { isDefault: false },
      });
    }
  }

  revalidatePath("/account");
  return { ok: true, message: "Address saved." };
}

export async function deleteAddressAction(id: string): Promise<AccountResult> {
  const user = await requireUser();
  const existing = await prisma.address.findFirst({ where: { id, userId: user.id } });
  if (!existing) return { ok: false, message: "Address not found." };
  await prisma.address.delete({ where: { id } });
  revalidatePath("/account");
  return { ok: true, message: "Address removed." };
}

export async function setDefaultAddressAction(id: string): Promise<AccountResult> {
  const user = await requireUser();
  const existing = await prisma.address.findFirst({ where: { id, userId: user.id } });
  if (!existing) return { ok: false, message: "Address not found." };
  await prisma.$transaction([
    prisma.address.updateMany({
      where: { userId: user.id },
      data: { isDefault: false },
    }),
    prisma.address.update({ where: { id }, data: { isDefault: true } }),
  ]);
  revalidatePath("/account");
  return { ok: true, message: "Default address updated." };
}
