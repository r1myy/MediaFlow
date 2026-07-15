import Link from "next/link";
import { redirect } from "next/navigation";
import { Mail } from "lucide-react";

import { auth } from "@/auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/modules/auth/actions";
import { db } from "@/lib/db";
import { ResendVerificationButton } from "@/components/dashboard/resend-verification-button";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await db.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { name: true, email: true, emailVerified: true },
  });

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-border/60 border-b">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 font-semibold tracking-tight"
          >
            <span className="bg-gradient-brand size-7 rounded-lg" aria-hidden />
            <span>MediaFlow</span>
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-muted-foreground hidden sm:inline">
              {user.name ?? user.email}
            </span>
            <Link
              href="/dashboard/settings/profile"
              className="text-muted-foreground hover:text-foreground"
            >
              Settings
            </Link>
            <form action={logoutAction}>
              <Button type="submit" variant="outline" size="sm">
                Log out
              </Button>
            </form>
          </div>
        </div>
      </header>

      {!user.emailVerified && (
        <div className="border-border/60 bg-accent/50 border-b">
          <div className="mx-auto max-w-6xl px-6 py-3">
            <Alert className="border-none bg-transparent p-0">
              <Mail />
              <AlertDescription className="flex flex-1 flex-wrap items-center justify-between gap-2">
                <span>Verify your email to secure your account.</span>
                <ResendVerificationButton />
              </AlertDescription>
            </Alert>
          </div>
        </div>
      )}

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">{children}</main>
    </div>
  );
}
