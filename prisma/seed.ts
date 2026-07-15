import { db } from "@/lib/db";

const GB = 1024 * 1024 * 1024;

/** Matches the four tiers on the marketing pricing page. */
const plans = [
  {
    slug: "trial",
    name: "Trial",
    description: "Try MediaFlow free for 7 days.",
    priceMonthlyCents: 0,
    priceYearlyCents: 0,
    maxSimultaneousJobs: 1,
    maxUploadsPerDay: 3,
    maxStorageBytes: BigInt(1) * BigInt(GB),
    maxQuality: "HD720",
    batchDownload: false,
    cloudSync: false,
    apiAccess: false,
    prioritySupport: false,
    multiUser: false,
    maxSeats: 1,
    sortOrder: 0,
  },
  {
    slug: "basic",
    name: "Basic",
    description: "For individuals building a media library.",
    priceMonthlyCents: 900,
    priceYearlyCents: 9_000,
    maxSimultaneousJobs: 5,
    maxUploadsPerDay: null,
    maxStorageBytes: BigInt(50) * BigInt(GB),
    maxQuality: "HD1080",
    batchDownload: false,
    cloudSync: false,
    apiAccess: false,
    prioritySupport: false,
    multiUser: false,
    maxSeats: 1,
    sortOrder: 1,
  },
  {
    slug: "premium",
    name: "Premium",
    description: "For power users and creators.",
    priceMonthlyCents: 2_900,
    priceYearlyCents: 29_000,
    // No real-world plan needs more than this; treated as "unlimited" in the UI.
    maxSimultaneousJobs: 9_999,
    maxUploadsPerDay: null,
    maxStorageBytes: BigInt(500) * BigInt(GB),
    maxQuality: "BEST",
    batchDownload: true,
    cloudSync: true,
    apiAccess: true,
    prioritySupport: false,
    multiUser: false,
    maxSeats: 1,
    sortOrder: 2,
  },
  {
    slug: "business",
    name: "Business",
    description: "For teams and organizations.",
    priceMonthlyCents: 9_900,
    priceYearlyCents: 99_000,
    maxSimultaneousJobs: 9_999,
    maxUploadsPerDay: null,
    maxStorageBytes: BigInt(2_000) * BigInt(GB),
    maxQuality: "BEST",
    batchDownload: true,
    cloudSync: true,
    apiAccess: true,
    prioritySupport: true,
    multiUser: true,
    maxSeats: 10,
    sortOrder: 3,
  },
] as const;

async function main() {
  for (const plan of plans) {
    await db.plan.upsert({
      where: { slug: plan.slug },
      create: plan,
      update: plan,
    });
    console.log(`Seeded plan: ${plan.name}`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
