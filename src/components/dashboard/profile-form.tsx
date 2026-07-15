"use client";

import { useActionState } from "react";

import { SubmitButton } from "@/components/auth/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfileAction } from "@/modules/auth/actions";
import { IDLE_STATE } from "@/modules/auth/actions/types";

export function ProfileForm({
  defaultName,
  email,
}: {
  defaultName: string;
  email: string;
}) {
  const [state, formAction] = useActionState(updateProfileAction, IDLE_STATE);

  return (
    <form action={formAction} className="space-y-4">
      {state.status === "error" && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      {state.status === "success" && (
        <Alert variant="success">
          <AlertDescription>Profile updated.</AlertDescription>
        </Alert>
      )}
      <div className="space-y-2">
        <Label htmlFor="email-display">Email</Label>
        <Input id="email-display" value={email} disabled />
      </div>
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" defaultValue={defaultName} required />
      </div>
      <SubmitButton className="w-fit">Save changes</SubmitButton>
    </form>
  );
}
