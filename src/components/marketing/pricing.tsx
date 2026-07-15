"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Trial",
    price: "Free",
    period: "for 7 days",
    description: "Try MediaFlow with no commitment.",
    features: ["3 uploads/day", "720p processing", "1 GB storage"],
    cta: "Start free trial",
    href: "/register",
  },
  {
    name: "Basic",
    price: "$9",
    period: "/month",
    description: "For individuals building a media library.",
    features: [
      "Unlimited uploads",
      "1080p processing",
      "5 simultaneous jobs",
      "Cloud history",
      "Priority queue",
    ],
    cta: "Choose Basic",
    href: "/register?plan=basic",
  },
  {
    name: "Premium",
    price: "$29",
    period: "/month",
    description: "For power users and creators.",
    features: [
      "Highest quality processing",
      "Unlimited simultaneous jobs",
      "Batch operations",
      "Collections & folders",
      "Cloud sync",
      "API access",
    ],
    cta: "Choose Premium",
    href: "/register?plan=premium",
    highlighted: true,
  },
  {
    name: "Business",
    price: "$99",
    period: "/month",
    description: "For teams and organizations.",
    features: [
      "Everything in Premium",
      "Multi-user seats",
      "Admin panel",
      "Usage analytics & reports",
      "Priority support",
    ],
    cta: "Contact sales",
    href: "/contact",
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="mx-auto max-w-6xl px-6 py-24">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Simple, transparent pricing
        </h2>
        <p className="text-muted-foreground mt-4">
          Start free. Upgrade as your library grows.
        </p>
      </div>

      <div className="mt-16 grid gap-6 lg:grid-cols-4">
        {plans.map((plan, i) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: i * 0.05 }}
          >
            <Card
              className={cn(
                "flex h-full flex-col",
                plan.highlighted && "border-primary ring-primary/20 shadow-lg ring-1",
              )}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{plan.name}</CardTitle>
                  {plan.highlighted && <Badge>Most popular</Badge>}
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-semibold">{plan.price}</span>
                  <span className="text-muted-foreground text-sm">{plan.period}</span>
                </div>
                <p className="text-muted-foreground text-sm">{plan.description}</p>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-2.5 text-sm">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="text-primary mt-0.5 size-4 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  asChild
                  variant={plan.highlighted ? "brand" : "outline"}
                  className="w-full"
                >
                  <Link href={plan.href}>{plan.cta}</Link>
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
