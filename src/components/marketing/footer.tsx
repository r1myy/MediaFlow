import Link from "next/link";

const columns = [
  {
    title: "Product",
    links: [
      { href: "#features", label: "Features" },
      { href: "#pricing", label: "Pricing" },
      { href: "/changelog", label: "Changelog" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/blog", label: "Blog" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
      { href: "/security", label: "Security" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-border/60 border-t">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 sm:grid-cols-2 md:grid-cols-4">
        <div>
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold tracking-tight"
          >
            <span className="bg-gradient-brand size-6 rounded-md" aria-hidden />
            <span>MediaFlow</span>
          </Link>
          <p className="text-muted-foreground mt-3 max-w-xs text-sm">
            The modern workspace for organizing, transcoding, and sharing your media
            library.
          </p>
        </div>

        {columns.map((column) => (
          <div key={column.title}>
            <h3 className="text-sm font-medium">{column.title}</h3>
            <ul className="text-muted-foreground mt-3 space-y-2 text-sm">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-border/60 text-muted-foreground border-t py-6 text-center text-xs">
        © {new Date().getFullYear()} MediaFlow. All rights reserved.
      </div>
    </footer>
  );
}
