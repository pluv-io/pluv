import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { buildServer } from "./buildServer";

const roots: string[] = [];

const makeDir = async (): Promise<string> => {
    const dir = await mkdtemp(join(tmpdir(), "pluv-build-"));

    roots.push(dir);

    return dir;
};

afterEach(async () => {
    await Promise.all(roots.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe("buildServer", () => {
    it("emits the io server module", async () => {
        const cwd = await makeDir();

        await writeFile(join(cwd, "pluv.ts"), `export default { marker: "pluv-build-test" };\n`);

        const outfile = await buildServer(cwd, join(cwd, "pluv.ts"));
        const text = await readFile(outfile, "utf8");

        expect(outfile).toBe(join(cwd, ".pluv/build/server.js"));
        expect(text).toContain("pluv-build-test");
        expect(text).not.toContain("RoomSupervisor");
    });
});
