import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/data/sqlite/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: "./.local/dumshare.db",
  },
  strict: true,
  verbose: true,
});
