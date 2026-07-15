import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

export function Cta() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-24">
      <div className="bg-gradient-brand relative overflow-hidden rounded-2xl px-8 py-16 text-center text-white sm:px-16">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Ready to organize your media library?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-white/80">
          Join creators and teams who trust MediaFlow to keep their video and audio
          library organized, searchable, and secure.
        </p>
        <Button size="lg" variant="secondary" asChild className="mt-8">
          <Link href="/register">
            Start your free trial
            <ArrowRight />
          </Link>
        </Button>
      </div>
    </section>
  );
}
