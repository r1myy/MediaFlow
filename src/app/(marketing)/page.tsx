import type { Metadata } from "next";

import { Cta } from "@/components/marketing/cta";
import { Features } from "@/components/marketing/features";
import { Hero } from "@/components/marketing/hero";
import { Pricing } from "@/components/marketing/pricing";

export const metadata: Metadata = {
  title: "MediaFlow — Organize your video & audio library",
  alternates: { canonical: "/" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "MediaFlow",
  applicationCategory: "MultimediaApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "AggregateOffer",
    priceCurrency: "USD",
    lowPrice: "0",
    highPrice: "99",
    offerCount: "4",
  },
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Hero />
      <Features />
      <Pricing />
      <Cta />
    </>
  );
}
