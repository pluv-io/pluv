import { defineConfig } from "drizzle-kit";

export default defineConfig({
    schema: "./src/db/schema.ts",
    dialect: "sqlite",
    dbCredentials: {
        url: "./dev.db",
    },
});
