"use client";

import * as React from "react";
import { useActionState } from "react";
import type { Plan } from "@prisma/client";

import { SubmitButton } from "@/components/auth/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCents } from "@/lib/format";
import { checkoutAction } from "@/modules/subscription/actions";
import { IDLE_STATE } from "@/modules/subscription/actions/types";

export function PlanPicker({
  plans,
  currentPlanSlug,
}: {
  plans: Plan[];
  currentPlanSlug: string;
}) {
  const [interval, setInterval] = React.useState<"MONTHLY" | "YEARLY">("MONTHLY");
  const [state, formAction] = useActionState(checkoutAction, IDLE_STATE);

  const purchasable = plans.filter((p) => p.slug !== "trial");
  const currentPlan = plans.find((p) => p.slug === currentPlanSlug);

  return (
    <div className="space-y-4">
      {state.status === "error" && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant={interval === "MONTHLY" ? "default" : "outline"}
          onClick={() => setInterval("MONTHLY")}
        >
          Monthly
        </Button>
        <Button
          type="button"
          size="sm"
          variant={interval === "YEARLY" ? "default" : "outline"}
          onClick={() => setInterval("YEARLY")}
        >
          Yearly
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {purchasable.map((plan) => {
          const priceCents =
            interval === "YEARLY" ? plan.priceYearlyCents : plan.priceMonthlyCents;
          const isCurrent = plan.slug === currentPlanSlug;

          return (
            <Card
              key={plan.id}
              className={isCurrent ? "border-primary ring-primary/20 ring-1" : ""}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{plan.name}</CardTitle>
                  {isCurrent && <Badge>Current</Badge>}
                </div>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-2xl font-semibold">
                    {formatCents(priceCents)}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    /{interval === "YEARLY" ? "year" : "month"}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="text-muted-foreground text-sm">
                {plan.description}
              </CardContent>
              <CardFooter>
                {isCurrent ? (
                  <Button variant="outline" className="w-full" disabled>
                    Current plan
                  </Button>
                ) : (
                  <form action={formAction} className="w-full">
                    <input type="hidden" name="planSlug" value={plan.slug} />
                    <input type="hidden" name="billingInterval" value={interval} />
                    <SubmitButton variant="brand">
                      {!currentPlan ||
                      plan.priceMonthlyCents > currentPlan.priceMonthlyCents
                        ? "Upgrade"
                        : "Downgrade"}
                    </SubmitButton>
                  </form>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
