"use client";

import { useActionState } from "react";

import { PasswordInput } from "@/components/auth/password-input";
import { SubmitButton } from "@/components/auth/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { changePasswordAction } from "@/modules/auth/actions";
import { IDLE_STATE } from "@/modules/auth/actions/types";

export function ChangePasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const [state, formAction] = useActionState(changePasswordAction, IDLE_STATE);

  return (
    <form action={formAction} className="space-y-4">
      {state.status === "error" && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      {state.status === "success" && (
        <Alert variant="success">
          <AlertDescription>
            Password updated. Other devices have been signed out.
          </AlertDescription>
        </Alert>
      )}
      {hasPassword && (
        <div className="space-y-2">
          <Label htmlFor="currentPassword">Current password</Label>
          <PasswordInput
            id="currentPassword"
            name="currentPassword"
            autoComplete="current-password"
            required
          />
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="newPassword">New password</Label>
        <PasswordInput
          id="newPassword"
          name="newPassword"
          autoComplete="new-password"
          required
        />
      </div>
      <SubmitButton className="w-fit">
        {hasPassword ? "Update password" : "Set password"}
      </SubmitButton>
    </form>
  );
}
