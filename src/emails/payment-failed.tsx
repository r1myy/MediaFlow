import * as React from "react";

import { EmailButton, EmailLayout, Text } from "@/emails/components/layout";

export interface PaymentFailedEmailProps {
  appUrl: string;
}

export default function PaymentFailedEmail({ appUrl }: PaymentFailedEmailProps) {
  return (
    <EmailLayout preview="Your MediaFlow payment failed" heading="Payment failed">
      <Text style={{ fontSize: "14px", color: "#374151", lineHeight: "22px" }}>
        We couldn&apos;t process your latest payment. Please update your payment method
        to avoid interruption to your subscription.
      </Text>
      <EmailButton href={`${appUrl}/dashboard/billing`}>
        Update payment method
      </EmailButton>
    </EmailLayout>
  );
}
