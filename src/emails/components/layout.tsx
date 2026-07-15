import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

const BRAND_COLOR = "#6d28d9";

export function EmailLayout({
  preview,
  heading,
  children,
}: {
  preview: string;
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body
        style={{
          backgroundColor: "#f4f4f7",
          fontFamily: "Helvetica, Arial, sans-serif",
        }}
      >
        <Container
          style={{
            backgroundColor: "#ffffff",
            margin: "40px auto",
            padding: "32px",
            borderRadius: "16px",
            maxWidth: "480px",
          }}
        >
          <Section style={{ textAlign: "center", marginBottom: "16px" }}>
            <div
              style={{
                display: "inline-block",
                width: "28px",
                height: "28px",
                borderRadius: "8px",
                background: BRAND_COLOR,
              }}
            />
            <Text style={{ fontWeight: 700, fontSize: "16px", margin: "8px 0 0" }}>
              MediaFlow
            </Text>
          </Section>
          <Heading
            style={{ fontSize: "20px", textAlign: "center", margin: "0 0 16px" }}
          >
            {heading}
          </Heading>
          {children}
          <Hr style={{ borderColor: "#e5e7eb", margin: "32px 0 16px" }} />
          <Text style={{ fontSize: "12px", color: "#6b7280", textAlign: "center" }}>
            MediaFlow — organize your video & audio library.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export function EmailButton({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Section style={{ textAlign: "center", margin: "24px 0" }}>
      <a
        href={href}
        style={{
          background: BRAND_COLOR,
          color: "#ffffff",
          padding: "12px 24px",
          borderRadius: "10px",
          textDecoration: "none",
          fontWeight: 600,
          fontSize: "14px",
          display: "inline-block",
        }}
      >
        {children}
      </a>
    </Section>
  );
}

export { Img, Text };
