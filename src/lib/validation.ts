import { z } from "zod";

// --- Auth ------------------------------------------------------------------

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required")
  .email("Enter a valid email address")
  .max(255);

// Strong-ish password policy: min 8 chars, at least one letter and one number.
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password is too long")
  .refine((v) => /[A-Za-z]/.test(v), "Include at least one letter")
  .refine((v) => /[0-9]/.test(v), "Include at least one number");

export const nameSchema = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(100);

export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(10),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// --- Address ---------------------------------------------------------------

export const addressSchema = z.object({
  fullName: nameSchema,
  phone: z
    .string()
    .trim()
    .min(7, "Enter a valid phone number")
    .max(20)
    .regex(/^[0-9+\-\s()]+$/, "Enter a valid phone number"),
  line1: z.string().trim().min(3, "Address is required").max(200),
  line2: z.string().trim().max(200).optional().or(z.literal("")),
  city: z.string().trim().min(1, "City is required").max(100),
  state: z.string().trim().max(100).optional().or(z.literal("")),
  postalCode: z.string().trim().min(3, "Postal code is required").max(20),
  country: z.string().trim().min(1).max(100),
  isDefault: z.boolean().optional(),
});

export type AddressInput = z.infer<typeof addressSchema>;

// --- Contact ---------------------------------------------------------------

export const contactSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  subject: z.string().trim().min(3, "Subject is required").max(150),
  message: z
    .string()
    .trim()
    .min(10, "Message must be at least 10 characters")
    .max(2000),
});

export const newsletterSchema = z.object({
  email: emailSchema,
});

// --- Reviews ---------------------------------------------------------------

export const reviewSchema = z.object({
  productId: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().max(120).optional().or(z.literal("")),
  body: z.string().trim().min(3, "Please write a short review").max(2000),
});

// --- Generic helpers -------------------------------------------------------

// Accepts the result of any Zod schema's safeParse (works with zod v4's
// discriminated result type without importing removed legacy aliases).
export function firstError(
  result:
    | { success: true }
    | { success: false; error: { issues: readonly { message: string }[] } },
): string | null {
  if (result.success) return null;
  return result.error.issues[0]?.message ?? "Invalid input";
}
