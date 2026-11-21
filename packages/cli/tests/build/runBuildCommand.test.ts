import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { resolveDevConfig } from "../../src/config/loadConfig";
import { runBuildCommand } from "../../src/commands/build/BuildScreen";
import { formatLogEvent, type LogEvent } from "../../src/log/event";

const roots: string[] = [];

const makeDir = async (): Promise<string> => {
    const dir = await mkdtemp(join(tmpdir(), "pluv-build-"));

    roots.push(dir);

    return dir;
};

afterEach(async () => {
    await Promise.all(roots.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe("runBuildCommand", () => {
    it("logs each phase and a summary table", async () => {
        const cwd = await makeDir();
        const events: LogEvent[] = [];

        await writeFile(
            join(cwd, "tsconfig.json"),
            JSON.stringify({
                compilerOptions: {
                    module: "ESNext",
                    moduleResolution: "Bundler",
                    noEmit: true,
                    strict: true,
                    target: "ESNext",
                    types: [],
                },
            }),
        );
        await writeFile(join(cwd, "entry.ts"), "export const ready = true;\n");
        await writeFile(join(cwd, "pluv.config.json"), JSON.stringify({ entry: "./entry.ts" }));

        const { config } = await resolveDevConfig(cwd, {});
        const result = await runBuildCommand(config, (event) => {
            events.push(event);
        });
        const stderr = events.map((event) => formatLogEvent(event) ?? "").join("");

        expect(stderr).toMatch(/Checking validity of types \.\.\./);
        expect(stderr).toMatch(/Finished TypeScript in \d+ms/);
        expect(stderr).toMatch(/Finished bundle in \d+ms/);
        expect(stderr).not.toMatch(/Total/);
        expect(result.artifact).toMatch(/entry/);
        expect(result.artifact).toMatch(/built/);
        expect(result.timings).toMatch(/TypeScript/);
        expect(result.timings).toMatch(/Total/);
    });

    it("skips typecheck logs when ignoreBuildErrors is set", async () => {
        const cwd = await makeDir();
        const events: LogEvent[] = [];

        await writeFile(join(cwd, "entry.ts"), "export const value: string = 1;\n");
        await writeFile(
            join(cwd, "pluv.config.json"),
            JSON.stringify({ entry: "./entry.ts", typescript: { ignoreBuildErrors: true } }),
        );

        const { config } = await resolveDevConfig(cwd, {});
        const result = await runBuildCommand(config, (event) => {
            events.push(event);
        });
        const stderr = events.map((event) => formatLogEvent(event) ?? "").join("");

        expect(stderr).not.toMatch(/Checking validity of types/);
        expect(stderr).not.toMatch(/TypeScript/);
        expect(stderr).toMatch(/Finished bundle in \d+ms/);
        expect(result.timings).toMatch(/Bundle/);
        expect(result.timings).toMatch(/Total/);
        expect(result.timings).not.toMatch(/TypeScript/);
    });
});
