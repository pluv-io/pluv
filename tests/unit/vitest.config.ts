import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        environment: "node",
        include: ["src/**/*.test.ts"],
        // Overlapping teardowns can deadlock rather than fail, so fail fast instead.
        testTimeout: 10_000,
    },
});
