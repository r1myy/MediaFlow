import * as React from "react";

import { EmailButton, EmailLayout, Text } from "@/emails/components/layout";

export interface ResetPasswordEmailProps {
  resetUrl: string;
}

export default function ResetPasswordEmail({ resetUrl }: ResetPasswordEmailProps) {
  return (
    <EmailLayout preview="Reset your MediaFlow password" heading="Reset your password">
      <Text style={{ fontSize: "14px", color: "#374151", lineHeight: "22px" }}>
        We received a request to reset your password. This link expires in 1 hour and
        can only be used once.
      </Text>
      <EmailButton href={resetUrl}>Reset password</EmailButton>
      <Text style={{ fontSize: "12px", color: "#9ca3af" }}>
        If you didn&apos;t request this, you can safely ignore this email — your
        password will not change.
      </Text>
    </EmailLayout>
  );
}
