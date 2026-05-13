import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { config } from "dotenv";
config({ path: ".env.local" });

const adapter = new PrismaBetterSqlite3({
  url: "file:./prisma/dev.db",
});

const prisma = new PrismaClient({ adapter });

const ADMIN_EMAIL = process.env.VERBI_ADMIN_EMAIL || "admin@verbi.local";
const ADMIN_NAME = process.env.VERBI_ADMIN_NAME || "Admin";

async function main() {
  const existing = await prisma.user.findFirst({ where: { isAdmin: true } });
  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { name: ADMIN_NAME, email: ADMIN_EMAIL, password: "" },
    });
  }
  console.log(`Admin login configured via .env.local: ${ADMIN_EMAIL}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
