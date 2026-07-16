const UNITS = ["B", "KB", "MB", "GB", "TB"] as const;

export function formatBytes(bytes: bigint | number): string {
  let value = typeof bytes === "bigint" ? Number(bytes) : bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < UNITS.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${UNITS[unitIndex]}`;
}

export function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}
