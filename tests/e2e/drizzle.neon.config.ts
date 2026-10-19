import { defineConfig } from "drizzle-kit";

const url = process.env.E2E_TEST_DATABASE_URL;

if (!url) {
    throw new Error("E2E_TEST_DATABASE_URL is required to push the Neon schema.");
}

export default defineConfig({
    schema: "./src/db/neon/schema.ts",
    dialect: "postgresql",
    dbCredentials: {
        url,
    },
    tablesFilter: ["Room"],
});
