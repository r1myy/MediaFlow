"use client";

import Link from "next/link";
import { useActionState } from "react";

import { SubmitButton } from "@/components/auth/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgotPasswordAction } from "@/modules/auth/actions";
import { IDLE_STATE } from "@/modules/auth/actions/types";

export default function ForgotPasswordPage() {
  const [state, formAction] = useActionState(forgotPasswordAction, IDLE_STATE);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Forgot your password?</CardTitle>
        <CardDescription>We&apos;ll email you a link to reset it.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {state.status === "success" ? (
          <Alert variant="success">
            <AlertDescription>
              If an account exists for that email, a reset link is on its way.
            </AlertDescription>
          </Alert>
        ) : (
          <form action={formAction} className="space-y-4">
            {state.status === "error" && (
              <Alert variant="destructive">
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                autoFocus
              />
            </div>
            <SubmitButton>Send reset link</SubmitButton>
          </form>
        )}
        <p className="text-muted-foreground text-center text-sm">
          <Link href="/login" className="text-foreground font-medium hover:underline">
            Back to login
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
