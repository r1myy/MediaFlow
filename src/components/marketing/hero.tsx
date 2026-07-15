"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, PlayCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="bg-gradient-brand pointer-events-none absolute inset-x-0 -top-40 -z-10 mx-auto h-[480px] max-w-4xl rounded-full opacity-20 blur-3xl"
      />

      <div className="mx-auto max-w-4xl px-6 pt-24 pb-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Badge variant="secondary" className="mb-6">
            Now with AI-powered auto-tagging
          </Badge>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="text-4xl font-semibold tracking-tight text-balance sm:text-6xl"
        >
          Your video & audio library,{" "}
          <span className="text-gradient">finally organized</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-muted-foreground mx-auto mt-6 max-w-2xl text-lg text-balance"
        >
          Upload, transcode, and organize your media in folders and collections — with
          AI tagging, smart search, and secure sharing. Built for creators and teams who
          live in their media library.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-3"
        >
          <Button variant="brand" size="lg" asChild>
            <Link href="/register">
              Start your 7-day free trial
              <ArrowRight />
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="#demo">
              <PlayCircle />
              Watch demo
            </Link>
          </Button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="text-muted-foreground mt-6 text-xs"
        >
          No credit card required · Cancel anytime
        </motion.p>
      </div>
    </section>
  );
}
