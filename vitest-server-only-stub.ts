// Stub for the "server-only" import guard, which throws unconditionally
// outside Next.js's bundler (it relies on webpack/turbopack aliasing to
// distinguish client/server bundles). Safe to no-op under Vitest, since
// nothing here runs in a browser.
export {};
