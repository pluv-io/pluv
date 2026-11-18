import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { updateDefineConfigSource, writeProjectTarget } from "./writeProjectTarget";

const roots: string[] = [];

const makeDir = async (): Promise<string> => {
    const dir = await mkdtemp(join(tmpdir(), "pluv-config-"));

    roots.push(dir);

    return dir;
};

afterEach(async () => {
    await Promise.all(roots.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

const target = { organization: "acme", project: "rooms" };

describe("updateDefineConfigSource", () => {
    it("adds the slugs inside an object literal and leaves other declarations", () => {
        const source = `const shared = { port: 8787 };

export default defineConfig({
    entry: "./pluv.ts",
    env: { TOKEN: process.env.TOKEN ?? "" },
});
`;
        const next = updateDefineConfigSource(source, target);

        expect(next).toContain("const shared = { port: 8787 };");
        expect(next).toContain('organization: "acme"');
        expect(next).toContain('project: "rooms"');
        expect(next).toContain('entry: "./pluv.ts"');
    });

    it("replaces slugs that are already string literals", () => {
        const source = `export default defineConfig({
    organization: "old",
    project: "old",
});
`;

        expect(updateDefineConfigSource(source, target)).toContain('organization: "acme"');
        expect(updateDefineConfigSource(source, target)).toContain('project: "rooms"');
        expect(updateDefineConfigSource(source, target)).not.toContain('"old"');
    });

    it("leaves a variable argument unchanged", () => {
        const source = `const config = { entry: "./pluv.ts" };

export default defineConfig(config);
`;

        expect(updateDefineConfigSource(source, target)).toBeNull();
    });

    it("leaves a spread unchanged", () => {
        const source = `export default defineConfig({
    ...shared,
    entry: "./pluv.ts",
});
`;

        expect(updateDefineConfigSource(source, target)).toBeNull();
    });

    it("leaves a shorthand slug unchanged", () => {
        const source = `export default defineConfig({
    organization,
    project: "rooms",
});
`;

        expect(updateDefineConfigSource(source, target)).toBeNull();
    });
});

describe("writeProjectTarget", () => {
    it("creates pluv.config.ts with the default entry when no config exists", async () => {
        const cwd = await makeDir();

        await expect(writeProjectTarget(cwd, target)).resolves.toEqual({ wrote: true });

        const source = await readFile(join(cwd, "pluv.config.ts"), "utf8");

        expect(source).toContain('entry: "./pluv.ts"');
        expect(source).toContain('organization: "acme"');
        expect(source).toContain('project: "rooms"');
    });

    it("updates a json config", async () => {
        const cwd = await makeDir();

        await writeFile(join(cwd, "pluv.config.json"), JSON.stringify({ port: 8787 }));

        await expect(writeProjectTarget(cwd, target)).resolves.toEqual({ wrote: true });

        const source = await readFile(join(cwd, "pluv.config.json"), "utf8");

        expect(JSON.parse(source)).toEqual({
            port: 8787,
            organization: "acme",
            project: "rooms",
        });
    });

    it("does not change a config that calls defineConfig with a variable", async () => {
        const cwd = await makeDir();
        const source = `const config = { entry: "./pluv.ts" };

export default defineConfig(config);
`;

        await writeFile(join(cwd, "pluv.config.ts"), source);

        await expect(writeProjectTarget(cwd, target)).resolves.toEqual({ wrote: false });
        await expect(readFile(join(cwd, "pluv.config.ts"), "utf8")).resolves.toBe(source);
    });
});
