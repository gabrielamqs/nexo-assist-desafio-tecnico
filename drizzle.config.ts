import { defineConfig } from "drizzle-kit";
import { CAMINHO_PADRAO_DO_BANCO } from "./lib/env";

export default defineConfig({
  dialect: "turso",
  schema: "./infrastructure/db/schema.ts",
  out: "./infrastructure/db/migrations",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? CAMINHO_PADRAO_DO_BANCO,
  },
});
