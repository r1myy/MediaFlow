"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { revokeDevice } from "@/modules/auth/service";

export async function revokeDeviceAction(deviceId: string) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  await revokeDevice(session.user.id, deviceId);
  revalidatePath("/dashboard/settings/security");
}
