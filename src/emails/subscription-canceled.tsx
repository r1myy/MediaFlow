import * as React from "react";

import { EmailButton, EmailLayout, Text } from "@/emails/components/layout";

export interface SubscriptionCanceledEmailProps {
  appUrl: string;
}

export default function SubscriptionCanceledEmail({
  appUrl,
}: SubscriptionCanceledEmailProps) {
  return (
    <EmailLayout
      preview="Your MediaFlow subscription ended"
      heading="Subscription canceled"
    >
      <Text style={{ fontSize: "14px", color: "#374151", lineHeight: "22px" }}>
        Your subscription has ended and your account has reverted to limited access. You
        can resubscribe any time to pick up where you left off.
      </Text>
      <EmailButton href={`${appUrl}/dashboard/billing`}>Resubscribe</EmailButton>
    </EmailLayout>
  );
}
