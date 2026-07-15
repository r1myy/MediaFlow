import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <div
        aria-hidden
        className="bg-gradient-brand pointer-events-none absolute inset-x-0 -top-40 -z-10 mx-auto h-[420px] max-w-3xl rounded-full opacity-15 blur-3xl"
      />
      <Link
        href="/"
        className="mb-8 flex items-center gap-2 font-semibold tracking-tight"
      >
        <span className="bg-gradient-brand size-7 rounded-lg" aria-hidden />
        <span>MediaFlow</span>
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
