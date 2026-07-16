"use client";

import { useActionState } from "react";
import type { SubscriptionStatus } from "@prisma/client";

import { SubmitButton } from "@/components/auth/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  billingPortalAction,
  cancelSubscriptionAction,
  resumeSubscriptionAction,
} from "@/modules/subscription/actions";
import { IDLE_STATE } from "@/modules/subscription/actions/types";

const STATUS_VARIANT: Record<
  SubscriptionStatus,
  "success" | "secondary" | "destructive"
> = {
  ACTIVE: "success",
  TRIALING: "secondary",
  PAST_DUE: "destructive",
  CANCELED: "destructive",
  INCOMPLETE: "destructive",
  INCOMPLETE_EXPIRED: "destructive",
  UNPAID: "destructive",
  PAUSED: "secondary",
};

export function ManageSubscription({
  planName,
  status,
  cancelAtPeriodEnd,
  currentPeriodEnd,
  hasStripeCustomer,
}: {
  planName: string;
  status: SubscriptionStatus;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: Date | null;
  hasStripeCustomer: boolean;
}) {
  const [portalState, portalAction] = useActionState(billingPortalAction, IDLE_STATE);
  const [cancelState, cancelAction] = useActionState(
    cancelSubscriptionAction,
    IDLE_STATE,
  );
  const [resumeState, resumeAction] = useActionState(
    resumeSubscriptionAction,
    IDLE_STATE,
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{planName} plan</CardTitle>
          <Badge variant={STATUS_VARIANT[status]}>
            {status.replace("_", " ").toLowerCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {cancelAtPeriodEnd && currentPeriodEnd && (
          <Alert>
            <AlertDescription>
              Your subscription will end on {currentPeriodEnd.toLocaleDateString()}.
            </AlertDescription>
          </Alert>
        )}
        {[portalState, cancelState, resumeState].map(
          (s, i) =>
            s.status === "error" && (
              <Alert variant="destructive" key={i}>
                <AlertDescription>{s.error}</AlertDescription>
              </Alert>
            ),
        )}

        <div className="flex flex-wrap gap-2">
          {hasStripeCustomer && (
            <form action={portalAction}>
              <SubmitButton variant="outline" className="w-fit">
                Manage billing
              </SubmitButton>
            </form>
          )}
          {status === "ACTIVE" && !cancelAtPeriodEnd && (
            <form action={cancelAction}>
              <SubmitButton variant="outline" className="w-fit">
                Cancel subscription
              </SubmitButton>
            </form>
          )}
          {status === "ACTIVE" && cancelAtPeriodEnd && (
            <form action={resumeAction}>
              <SubmitButton className="w-fit">Resume subscription</SubmitButton>
            </form>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
