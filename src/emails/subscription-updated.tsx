import * as React from "react";

import { EmailButton, EmailLayout, Text } from "@/emails/components/layout";

export interface SubscriptionUpdatedEmailProps {
  planName: string;
  appUrl: string;
}

export default function SubscriptionUpdatedEmail({
  planName,
  appUrl,
}: SubscriptionUpdatedEmailProps) {
  return (
    <EmailLayout
      preview={`You're now on the ${planName} plan`}
      heading="Subscription updated"
    >
      <Text style={{ fontSize: "14px", color: "#374151", lineHeight: "22px" }}>
        You&apos;re now on the <strong>{planName}</strong> plan. Your new limits and
        features are active immediately.
      </Text>
      <EmailButton href={`${appUrl}/dashboard/billing`}>View billing</EmailButton>
    </EmailLayout>
  );
}
