"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { updateProfile } from "@/modules/auth/service";

import type { SimpleActionState } from "@/modules/auth/actions/types";

export async function updateProfileAction(
  _prev: SimpleActionState,
  formData: FormData,
): Promise<SimpleActionState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const name = formData.get("name")?.toString().trim();
  if (!name) {
    return { status: "error", error: "Name is required." };
  }

  await updateProfile(session.user.id, name);
  revalidatePath("/dashboard/settings/profile");
  return { status: "success" };
}
