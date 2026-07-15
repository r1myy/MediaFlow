"use client";

import * as React from "react";
import Image from "next/image";
import { useActionState } from "react";

import { SubmitButton } from "@/components/auth/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  confirmTwoFactorSetupAction,
  disableTwoFactorAction,
  startTwoFactorSetupAction,
} from "@/modules/auth/actions";
import { IDLE_STATE } from "@/modules/auth/actions/types";
import type {
  ConfirmTwoFactorState,
  TwoFactorSetupState,
} from "@/modules/auth/actions/two-factor";

const SETUP_IDLE: TwoFactorSetupState = { status: "idle" };
const CONFIRM_IDLE: ConfirmTwoFactorState = { status: "idle" };

export function TwoFactorSettings({ enabled }: { enabled: boolean }) {
  const [setup, setSetup] = React.useState<TwoFactorSetupState>(SETUP_IDLE);
  const [starting, startTransition] = React.useTransition();
  const [confirmState, confirmAction] = useActionState(
    confirmTwoFactorSetupAction,
    CONFIRM_IDLE,
  );
  const [disableState, disableAction] = useActionState(
    disableTwoFactorAction,
    IDLE_STATE,
  );

  if (confirmState.status === "success" && confirmState.backupCodes) {
    return (
      <div className="space-y-4">
        <Alert variant="success">
          <AlertDescription>
            Two-factor authentication is enabled. Save these backup codes somewhere safe
            — each can be used once if you lose access to your authenticator app.
          </AlertDescription>
        </Alert>
        <div className="bg-muted grid grid-cols-2 gap-2 rounded-lg p-4 font-mono text-sm">
          {confirmState.backupCodes.map((code) => (
            <span key={code}>{code}</span>
          ))}
        </div>
        <Button onClick={() => window.location.reload()}>Done</Button>
      </div>
    );
  }

  if (enabled) {
    return (
      <div className="space-y-4">
        <Badge variant="success">Enabled</Badge>
        <form action={disableAction} className="space-y-3">
          {disableState.status === "error" && (
            <Alert variant="destructive">
              <AlertDescription>{disableState.error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="disable-code">Enter a code to disable</Label>
            <Input id="disable-code" name="code" required />
          </div>
          <Button type="submit" variant="destructive" size="sm">
            Disable two-factor authentication
          </Button>
        </form>
      </div>
    );
  }

  if (setup.status === "pending") {
    return (
      <div className="space-y-4">
        {setup.qrCodeDataUrl && (
          <Image
            src={setup.qrCodeDataUrl}
            alt="Two-factor authentication QR code"
            width={180}
            height={180}
            className="rounded-lg border"
            unoptimized
          />
        )}
        <p className="text-muted-foreground text-sm">
          Scan with your authenticator app, or enter this code manually:{" "}
          <code className="bg-muted rounded px-1.5 py-0.5">{setup.secret}</code>
        </p>
        <form action={confirmAction} className="space-y-3">
          {confirmState.status === "error" && (
            <Alert variant="destructive">
              <AlertDescription>{confirmState.error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="confirm-code">6-digit code</Label>
            <Input
              id="confirm-code"
              name="code"
              autoComplete="one-time-code"
              required
            />
          </div>
          <SubmitButton className="w-fit">Confirm & enable</SubmitButton>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Badge variant="secondary">Disabled</Badge>
      {setup.status === "error" && (
        <Alert variant="destructive">
          <AlertDescription>{setup.error}</AlertDescription>
        </Alert>
      )}
      <div>
        <Button
          type="button"
          disabled={starting}
          onClick={() =>
            startTransition(async () => setSetup(await startTwoFactorSetupAction()))
          }
        >
          Enable two-factor authentication
        </Button>
      </div>
    </div>
  );
}
