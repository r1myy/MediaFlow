"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { resendVerificationAction } from "@/modules/auth/actions";

export function ResendVerificationButton() {
  const [state, setState] = React.useState<"idle" | "sent" | "error">("idle");
  const [pending, startTransition] = React.useTransition();

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      disabled={pending || state === "sent"}
      onClick={() =>
        startTransition(async () => {
          const result = await resendVerificationAction();
          setState(result.status === "success" ? "sent" : "error");
        })
      }
    >
      {state === "sent" ? "Email sent" : "Resend email"}
    </Button>
  );
}
