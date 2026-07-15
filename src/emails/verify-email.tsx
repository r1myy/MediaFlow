import * as React from "react";

import { EmailButton, EmailLayout, Text } from "@/emails/components/layout";

export interface VerifyEmailProps {
  verifyUrl: string;
}

export default function VerifyEmail({ verifyUrl }: VerifyEmailProps) {
  return (
    <EmailLayout preview="Verify your MediaFlow email" heading="Verify your email">
      <Text style={{ fontSize: "14px", color: "#374151", lineHeight: "22px" }}>
        Confirm this is your email address to secure your account. This link expires in
        24 hours.
      </Text>
      <EmailButton href={verifyUrl}>Verify email</EmailButton>
      <Text style={{ fontSize: "12px", color: "#9ca3af" }}>
        If you didn&apos;t create a MediaFlow account, you can ignore this email.
      </Text>
    </EmailLayout>
  );
}
