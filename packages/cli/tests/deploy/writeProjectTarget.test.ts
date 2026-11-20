import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { writeProjectTarget } from "../../src/commands/deploy/writeProjectTarget";

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

    it("does not change an existing ts config", async () => {
        const cwd = await makeDir();
        const source = `export default {
    entry: "./pluv.ts",
};
`;

        await writeFile(join(cwd, "pluv.config.ts"), source);

        const result = await writeProjectTarget(cwd, target);

        expect(result.wrote).toBe(false);
        expect(result.hint).toContain("pluv.config.ts was not updated");
        expect(result.hint).toContain('organization: "acme"');
        expect(result.hint).toContain('project: "rooms"');
        await expect(readFile(join(cwd, "pluv.config.ts"), "utf8")).resolves.toBe(source);
    });
});
