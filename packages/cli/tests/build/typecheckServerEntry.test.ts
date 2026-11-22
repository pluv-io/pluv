import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { typecheckServerEntry } from "../../src/commands/build/typecheckServerEntry";

const cliRoot = fileURLToPath(new URL("../..", import.meta.url));
const roots: string[] = [];

const makeDir = async (parent = tmpdir()): Promise<string> => {
    const dir = await mkdtemp(join(parent, "pluv-typecheck-"));

    roots.push(dir);

    return dir;
};

const tsconfig = (types: string[] = []): string => {
    return JSON.stringify({
        compilerOptions: {
            module: "ESNext",
            moduleResolution: "Bundler",
            noEmit: true,
            skipLibCheck: true,
            strict: true,
            target: "ESNext",
            types,
        },
    });
};

afterEach(async () => {
    await Promise.all(roots.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe("typecheckServerEntry", () => {
    it("accepts a valid TypeScript entry", async () => {
        const cwd = await makeDir(cliRoot);

        await writeFile(join(cwd, "tsconfig.json"), tsconfig());
        await writeFile(join(cwd, "entry.ts"), "export const ready = true;\n");

        await expect(
            typecheckServerEntry({ cwd, entry: join(cwd, "entry.ts") }),
        ).resolves.toBeUndefined();
    });

    it("reports a type error", async () => {
        const cwd = await makeDir(cliRoot);

        await writeFile(join(cwd, "tsconfig.json"), tsconfig());
        await writeFile(join(cwd, "entry.ts"), "export const value: string = 1;\n");

        await expect(typecheckServerEntry({ cwd, entry: join(cwd, "entry.ts") })).rejects.toThrow(
            /TS2322/,
        );
    });

    it("fails when the project has no typescript package", async () => {
        const cwd = await makeDir();

        await writeFile(join(cwd, "tsconfig.json"), tsconfig());
        await writeFile(join(cwd, "entry.ts"), "export const ready = true;\n");

        await expect(typecheckServerEntry({ cwd, entry: join(cwd, "entry.ts") })).rejects.toThrow(
            /Could not find typescript in this project[\s\S]*--no-typecheck/,
        );
    });

    it("fails when only a jsconfig is present", async () => {
        const cwd = await makeDir();

        await writeFile(join(cwd, "jsconfig.json"), tsconfig());
        await writeFile(join(cwd, "entry.ts"), "export const ready = true;\n");

        await expect(typecheckServerEntry({ cwd, entry: join(cwd, "entry.ts") })).rejects.toThrow(
            /No tsconfig\.json was found[\s\S]*jsconfig\.json is not used/,
        );
    });

    it("typechecks a hosted @pluv/platform entry without worker types", async () => {
        const cwd = await makeDir(join(cliRoot, "tests"));

        await writeFile(join(cwd, "tsconfig.json"), tsconfig());
        await writeFile(
            join(cwd, "entry.ts"),
            `import { platformPluv } from "@pluv/platform";\nexport default platformPluv();\n`,
        );

        await expect(
            typecheckServerEntry({ cwd, entry: join(cwd, "entry.ts") }),
        ).resolves.toBeUndefined();
    });
});
