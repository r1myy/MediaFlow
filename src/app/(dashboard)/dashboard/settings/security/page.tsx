import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { ChangePasswordForm } from "@/components/dashboard/change-password-form";
import { DeviceList } from "@/components/dashboard/device-list";
import { TwoFactorSettings } from "@/components/dashboard/two-factor-settings";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { db } from "@/lib/db";
import { listDevices } from "@/modules/auth/service";

export default async function SecuritySettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [user, devices] = await Promise.all([
    db.user.findUniqueOrThrow({
      where: { id: session.user.id },
      select: { twoFactorEnabled: true, passwordHash: true },
    }),
    listDevices(session.user.id),
  ]);

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Security</h1>
        <p className="text-muted-foreground">
          Password, two-factor authentication, and devices.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>
            {user.passwordHash
              ? "Change your password. You'll be signed out of every other device."
              : "Set a password to enable email+password sign-in for this account."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm hasPassword={Boolean(user.passwordHash)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Two-factor authentication</CardTitle>
          <CardDescription>
            Add an extra layer of security with an authenticator app.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TwoFactorSettings enabled={user.twoFactorEnabled} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Devices</CardTitle>
          <CardDescription>Everywhere you&apos;re currently signed in.</CardDescription>
        </CardHeader>
        <CardContent>
          <DeviceList devices={devices} />
        </CardContent>
      </Card>
    </div>
  );
}
