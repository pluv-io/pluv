import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { resolveDevConfig } from "./loadConfig";

const roots: string[] = [];

const makeDir = async (): Promise<string> => {
    const dir = await mkdtemp(join(tmpdir(), "pluv-dev-config-"));

    roots.push(dir);

    return dir;
};

afterEach(async () => {
    await Promise.all(roots.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe("resolveDevConfig", () => {
    it("warns and uses defaults when no config file exists", async () => {
        const cwd = await makeDir();
        const { config, warning } = await resolveDevConfig(cwd, {});

        expect(warning).toBe("No pluv.config.ts was found. Defaults will be used.");
        expect(config).toEqual({
            entry: resolve(cwd, "pluv.ts"),
            env: {},
            distDir: resolve(cwd, ".pluv"),
            port: 8787,
        });
    });

    it("requires an entry when a config file omits it", async () => {
        const cwd = await makeDir();

        await writeFile(join(cwd, "pluv.config.json"), JSON.stringify({ port: 8787 }));

        await expect(resolveDevConfig(cwd, {})).rejects.toThrow(
            "pluv dev needs an entry path. Pass one, or set entry in pluv.config.ts.",
        );
    });

    it("uses the flag entry and the default port", async () => {
        const cwd = await makeDir();
        const { config, warning } = await resolveDevConfig(cwd, { entry: "./src/io.ts" });

        expect(warning).toBe("No pluv.config.ts was found. Defaults will be used.");
        expect(config).toEqual({
            entry: resolve(cwd, "src/io.ts"),
            env: {},
            distDir: resolve(cwd, ".pluv"),
            port: 8787,
        });
    });

    it("reads pluv.config.ts and lets flags override it", async () => {
        const cwd = await makeDir();

        await writeFile(
            join(cwd, "pluv.config.ts"),
            `export default {
                entry: "./from-file.ts",
                port: 8791,
            };
            `,
        );

        const { config: fromFile, warning } = await resolveDevConfig(cwd, {});

        expect(warning).toBeNull();
        expect(fromFile).toEqual({
            entry: resolve(cwd, "from-file.ts"),
            env: {},
            distDir: resolve(cwd, ".pluv"),
            port: 8791,
        });

        const { config: overridden } = await resolveDevConfig(cwd, {
            entry: "./from-flag.ts",
            port: 8799,
        });

        expect(overridden).toEqual({
            entry: resolve(cwd, "from-flag.ts"),
            env: {},
            distDir: resolve(cwd, ".pluv"),
            port: 8799,
        });
    });

    it("rejects a port outside 1 to 65535", async () => {
        const cwd = await makeDir();

        await expect(resolveDevConfig(cwd, { entry: "./room.ts", port: 0 })).rejects.toThrow(
            "port must be an integer from 1 to 65535.",
        );
        await expect(resolveDevConfig(cwd, { entry: "./room.ts", port: 65536 })).rejects.toThrow(
            "port must be an integer from 1 to 65535.",
        );
    });

    it("rejects a config file that is not an object", async () => {
        const cwd = await makeDir();
        const filePath = join(cwd, "pluv.config.json");

        await writeFile(filePath, "[]");

        await expect(resolveDevConfig(cwd, {})).rejects.toThrow(filePath);
        await expect(resolveDevConfig(cwd, {})).rejects.toThrow(
            "Invalid input: expected object, received array",
        );
    });

    it("uses the distDir from the config file", async () => {
        const cwd = await makeDir();

        await writeFile(
            join(cwd, "pluv.config.json"),
            JSON.stringify({ entry: "./pluv.ts", distDir: "./dist" }),
        );

        const { config } = await resolveDevConfig(cwd, {});

        expect(config.distDir).toBe(resolve(cwd, "dist"));
    });

    it("rejects a distDir that is not a directory path", async () => {
        const cwd = await makeDir();
        const filePath = join(cwd, "pluv.config.json");

        await writeFile(filePath, JSON.stringify({ entry: "./pluv.ts", distDir: "" }));

        await expect(resolveDevConfig(cwd, {})).rejects.toThrow(filePath);
        await expect(resolveDevConfig(cwd, {})).rejects.toThrow(
            "distDir must be a directory path.",
        );
    });

    it("rejects an entry that is not a module path", async () => {
        const cwd = await makeDir();
        const filePath = join(cwd, "pluv.config.json");

        await writeFile(filePath, JSON.stringify({ entry: "" }));

        await expect(resolveDevConfig(cwd, {})).rejects.toThrow(filePath);
        await expect(resolveDevConfig(cwd, {})).rejects.toThrow("entry must be a module path.");
    });

    it("prints each invalid field", async () => {
        const cwd = await makeDir();
        const filePath = join(cwd, "pluv.config.json");

        await writeFile(filePath, JSON.stringify({ port: "no", outbound: true, vars: ["A"] }));

        await expect(resolveDevConfig(cwd, { entry: "./room.ts" })).rejects.toThrow(
            /Unrecognized keys: "outbound", "vars"[\s\S]*port must be an integer from 1 to 65535/,
        );
    });

    it("maps .env through the config onto the room env", async () => {
        const cwd = await makeDir();
        const key = "PLUVIO_TEST_DATABASE_URL";

        delete process.env[key];
        await writeFile(join(cwd, ".env"), `${key}=postgres://localhost/db\n`);
        await writeFile(
            join(cwd, "pluv.config.ts"),
            `export default { entry: "./pluv.ts", env: { DATABASE_URL: process.env.${key} } };`,
        );

        try {
            const { config } = await resolveDevConfig(cwd, {});

            expect(config.env).toEqual({ DATABASE_URL: "postgres://localhost/db" });
        } finally {
            delete process.env[key];
        }
    });

    it("keeps a shell variable when .env sets the same name", async () => {
        const cwd = await makeDir();
        const key = "PLUVIO_TEST_DATABASE_URL";

        process.env[key] = "from-shell";
        await writeFile(join(cwd, ".env"), `${key}=from-file\n`);
        await writeFile(
            join(cwd, "pluv.config.ts"),
            `export default { entry: "./pluv.ts", env: { DATABASE_URL: process.env.${key} } };`,
        );

        try {
            const { config } = await resolveDevConfig(cwd, {});

            expect(config.env).toEqual({ DATABASE_URL: "from-shell" });
        } finally {
            delete process.env[key];
        }
    });

    it("rejects a reserved env key and a non-string value", async () => {
        const cwd = await makeDir();
        const filePath = join(cwd, "pluv.config.json");

        await writeFile(filePath, JSON.stringify({ entry: "./pluv.ts", env: { PLUV_TOKEN: "x" } }));
        await expect(resolveDevConfig(cwd, {})).rejects.toThrow(
            "Env keys starting with PLUV_ are reserved.",
        );

        await writeFile(filePath, JSON.stringify({ entry: "./pluv.ts", env: { DATABASE_URL: 1 } }));
        await expect(resolveDevConfig(cwd, {})).rejects.toThrow("env values must be strings.");
    });
});
