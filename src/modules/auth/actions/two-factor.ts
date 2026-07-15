"use server";

import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AuthError } from "@/modules/auth/errors";
import {
  confirmTwoFactorSetup,
  disableTwoFactor,
  startTwoFactorSetup,
} from "@/modules/auth/service";

import type { SimpleActionState } from "@/modules/auth/actions/types";

export interface TwoFactorSetupState {
  status: "idle" | "pending" | "error";
  error?: string;
  qrCodeDataUrl?: string;
  secret?: string;
}

export async function startTwoFactorSetupAction(): Promise<TwoFactorSetupState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  try {
    const { secret, qrCodeDataUrl } = await startTwoFactorSetup(session.user.id);
    return { status: "pending", secret, qrCodeDataUrl };
  } catch (err) {
    if (err instanceof AuthError) return { status: "error", error: err.message };
    throw err;
  }
}

export interface ConfirmTwoFactorState {
  status: "idle" | "success" | "error";
  error?: string;
  backupCodes?: string[];
}

export async function confirmTwoFactorSetupAction(
  _prev: ConfirmTwoFactorState,
  formData: FormData,
): Promise<ConfirmTwoFactorState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const code = formData.get("code")?.toString() ?? "";
  try {
    const { backupCodes } = await confirmTwoFactorSetup(session.user.id, code);
    return { status: "success", backupCodes };
  } catch (err) {
    if (err instanceof AuthError) return { status: "error", error: err.message };
    throw err;
  }
}

export async function disableTwoFactorAction(
  _prev: SimpleActionState,
  formData: FormData,
): Promise<SimpleActionState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const code = formData.get("code")?.toString() ?? "";
  try {
    await disableTwoFactor(session.user.id, code);
  } catch (err) {
    if (err instanceof AuthError) return { status: "error", error: err.message };
    throw err;
  }

  return { status: "success" };
}
