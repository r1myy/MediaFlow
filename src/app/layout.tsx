import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { Providers } from "@/components/providers";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "MediaFlow — Organize your video & audio library",
    template: "%s · MediaFlow",
  },
  description:
    "MediaFlow is the modern media workspace: upload, organize, transcode, and share your video and audio library with folders, collections, and AI-powered tagging.",
  keywords: [
    "media library",
    "video management",
    "audio management",
    "media SaaS",
    "cloud storage",
    "media organizer",
  ],
  authors: [{ name: "MediaFlow" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: appUrl,
    siteName: "MediaFlow",
    title: "MediaFlow — Organize your video & audio library",
    description:
      "Upload, organize, transcode, and share your video and audio library in one modern workspace.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "MediaFlow" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "MediaFlow — Organize your video & audio library",
    description:
      "Upload, organize, transcode, and share your video and audio library in one modern workspace.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/favicon.ico",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
