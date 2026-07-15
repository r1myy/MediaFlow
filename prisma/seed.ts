import { db } from "@/lib/db";

/**
 * Seeds baseline data (subscription plans, etc.). Expanded in Phase 2.
 */
async function main() {
  console.log("Seeding skipped — no seed data defined yet (see Phase 2).");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
