import { defineConfig } from "drizzle-kit";
import { lerAmbiente } from "./lib/env";

export default defineConfig({
  dialect: "turso",
  schema: "./infrastructure/db/schema.ts",
  out: "./infrastructure/db/migrations",
  dbCredentials: {
    url: lerAmbiente().DATABASE_URL,
    authToken: lerAmbiente().DATABASE_AUTH_TOKEN,
  },
});
