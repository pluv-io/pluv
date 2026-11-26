import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { loadDotenv } from "../../src/config/loadDotenv";

const key = "PLUV_API_TOKEN";

afterEach(() => {
    delete process.env[key];
});

describe("loadDotenv", () => {
    it("loads PLUV_API_TOKEN from .env when unset in the shell", async () => {
        const cwd = await mkdtemp(join(tmpdir(), "pluv-dotenv-"));

        try {
            await writeFile(join(cwd, ".env"), `${key}=from-dotenv\n`);

            loadDotenv(cwd);

            expect(process.env[key]).toBe("from-dotenv");
        } finally {
            await rm(cwd, { recursive: true, force: true });
        }
    });

    it("lets .env.local override .env for the same key", async () => {
        const cwd = await mkdtemp(join(tmpdir(), "pluv-dotenv-"));

        try {
            await writeFile(join(cwd, ".env"), `${key}=from-dotenv\n`);
            await writeFile(join(cwd, ".env.local"), `${key}=from-local\n`);

            loadDotenv(cwd);

            expect(process.env[key]).toBe("from-local");
        } finally {
            await rm(cwd, { recursive: true, force: true });
        }
    });

    it("keeps a value already set in the shell", async () => {
        const cwd = await mkdtemp(join(tmpdir(), "pluv-dotenv-"));

        process.env[key] = "from-shell";

        try {
            await writeFile(join(cwd, ".env"), `${key}=from-dotenv\n`);

            loadDotenv(cwd);

            expect(process.env[key]).toBe("from-shell");
        } finally {
            await rm(cwd, { recursive: true, force: true });
        }
    });
});
