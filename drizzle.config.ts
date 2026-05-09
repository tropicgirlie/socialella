import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Pick up DATABASE_URL from .env.local (Next.js convention)
config({ path: ".env.local" });
config({ path: ".env" });

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
