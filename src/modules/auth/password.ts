import bcrypt from "bcryptjs";
import { z } from "zod";

const BCRYPT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export const passwordSchema = z
  .string()
  .min(10, "Password must be at least 10 characters.")
  .max(128, "Password must be at most 128 characters.")
  .refine((v) => /[a-z]/.test(v), "Password must contain a lowercase letter.")
  .refine((v) => /[A-Z]/.test(v), "Password must contain an uppercase letter.")
  .refine((v) => /[0-9]/.test(v), "Password must contain a number.");

export const emailSchema = z.email("Enter a valid email address.").toLowerCase().trim();

export const registerSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(100),
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required."),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: passwordSchema,
});

export const changePasswordSchema = z.object({
  // Empty for OAuth-only accounts setting a password for the first time —
  // the service layer only checks it when the user already has one.
  currentPassword: z.string().default(""),
  newPassword: passwordSchema,
});
