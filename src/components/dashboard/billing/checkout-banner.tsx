"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";

function CheckoutBannerInner() {
  const searchParams = useSearchParams();
  const checkout = searchParams.get("checkout");

  if (checkout === "success") {
    return (
      <Alert variant="success">
        <AlertDescription>
          Payment successful — your new plan is active.
        </AlertDescription>
      </Alert>
    );
  }
  if (checkout === "canceled") {
    return (
      <Alert>
        <AlertDescription>
          Checkout was canceled — no changes were made.
        </AlertDescription>
      </Alert>
    );
  }
  return null;
}

export function CheckoutBanner() {
  return (
    <Suspense fallback={null}>
      <CheckoutBannerInner />
    </Suspense>
  );
}
