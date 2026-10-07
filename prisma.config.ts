import path from "node:path";
import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Match Next.js: .env.local takes precedence over .env
config({ path: [".env.local", ".env"], quiet: true });

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
