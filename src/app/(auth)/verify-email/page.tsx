import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { verifyEmailToken } from "@/modules/auth/service";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  let error: string | null = null;
  if (!token) {
    error = "This verification link is missing its token.";
  } else {
    try {
      await verifyEmailToken(token);
    } catch (err) {
      error = err instanceof Error ? err.message : "Something went wrong.";
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email verification</CardTitle>
        <CardDescription>
          {error ? "We couldn't verify your email." : "Your email has been verified."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? (
          <Alert variant="destructive">
            <XCircle />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <Alert variant="success">
            <CheckCircle2 />
            <AlertDescription>
              Thanks for confirming your email address.
            </AlertDescription>
          </Alert>
        )}
        <Button asChild className="w-full">
          <Link href="/dashboard">Go to dashboard</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
