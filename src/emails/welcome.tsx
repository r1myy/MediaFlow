import * as React from "react";

import { EmailButton, EmailLayout, Text } from "@/emails/components/layout";

export interface WelcomeEmailProps {
  name: string;
  appUrl: string;
}

export default function WelcomeEmail({ name, appUrl }: WelcomeEmailProps) {
  return (
    <EmailLayout preview="Welcome to MediaFlow" heading={`Welcome, ${name}!`}>
      <Text style={{ fontSize: "14px", color: "#374151", lineHeight: "22px" }}>
        Your 7-day free trial is active. Upload your first video or audio file to start
        organizing your library — folders, collections, and AI-powered tagging are ready
        to go.
      </Text>
      <EmailButton href={`${appUrl}/dashboard`}>Go to your dashboard</EmailButton>
    </EmailLayout>
  );
}
