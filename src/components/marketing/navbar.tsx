import Link from "next/link";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/marketing/theme-toggle";

const links = [
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Pricing" },
  { href: "/blog", label: "Blog" },
];

export function Navbar() {
  return (
    <header className="border-border/60 bg-background/80 sticky top-0 z-50 border-b backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="bg-gradient-brand size-7 rounded-lg" aria-hidden />
          <span>MediaFlow</span>
        </Link>

        <nav className="text-muted-foreground hidden items-center gap-8 text-sm md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hover:text-foreground transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
            <Link href="/login">Log in</Link>
          </Button>
          <Button variant="brand" size="sm" asChild>
            <Link href="/register">Start free trial</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
