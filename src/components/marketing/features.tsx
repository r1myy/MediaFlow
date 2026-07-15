"use client";

import { motion } from "framer-motion";
import { FolderTree, Languages, Search, Share2, Sparkles, Upload } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    icon: Upload,
    title: "Effortless uploads",
    description:
      "Drag-and-drop or import from your own cloud storage. Resumable uploads handle files of any size.",
  },
  {
    icon: FolderTree,
    title: "Folders & collections",
    description:
      "Organize your library exactly how you think — nested folders, shareable collections, and favorites.",
  },
  {
    icon: Sparkles,
    title: "AI-powered tagging",
    description:
      "Automatic filename suggestions, tags, categories, and duplicate detection powered by AI.",
  },
  {
    icon: Languages,
    title: "Transcripts & summaries",
    description:
      "Generate transcripts, detect language, and summarize long-form content in seconds.",
  },
  {
    icon: Search,
    title: "Instant search",
    description:
      "Full-text and metadata search across your entire library, with filters for type, tag, and folder.",
  },
  {
    icon: Share2,
    title: "Secure sharing",
    description:
      "Share files or collections with expiring links and granular access controls.",
  },
];

export function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-6 py-24">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Everything your media workflow needs
        </h2>
        <p className="text-muted-foreground mt-4">
          A single, beautifully organized home for every video and audio file you own.
        </p>
      </div>

      <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature, i) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: i * 0.05 }}
          >
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="bg-gradient-brand mb-2 flex size-10 items-center justify-center rounded-lg text-white">
                  <feature.icon className="size-5" />
                </div>
                <CardTitle className="text-base">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
