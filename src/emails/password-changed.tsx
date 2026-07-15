import * as React from "react";

import { EmailLayout, Text } from "@/emails/components/layout";

export default function PasswordChangedEmail() {
  return (
    <EmailLayout
      preview="Your MediaFlow password was changed"
      heading="Password changed"
    >
      <Text style={{ fontSize: "14px", color: "#374151", lineHeight: "22px" }}>
        Your MediaFlow password was just changed. You&apos;ve been signed out of all
        other devices as a precaution.
      </Text>
      <Text style={{ fontSize: "12px", color: "#9ca3af" }}>
        If this wasn&apos;t you, contact support immediately.
      </Text>
    </EmailLayout>
  );
}
