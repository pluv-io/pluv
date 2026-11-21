import { readFile, writeFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { z } from "zod";
import { findConfigFile } from "../../config/loadConfig";
import { DEFAULT_ENTRY } from "../../schemas";

const ZodJsonObject = z.record(z.string(), z.unknown());

export type ProjectTarget = {
    organization: string;
    project: string;
};

export type WriteProjectTargetResult = {
    wrote: boolean;
    /** Help text when save was requested but the config file was left unchanged. */
    hint?: string;
};

const projectTargetSaveHint = (configFileName: string, target: ProjectTarget): string => {
    return [
        `${configFileName} was not updated. Add to defineConfig:`,
        "",
        `    organization: ${JSON.stringify(target.organization)},`,
        `    project: ${JSON.stringify(target.project)},`,
        "",
        "Or use pluv.config.json, or set PLUV_ORGANIZATION and PLUV_PROJECT.",
    ].join("\n");
};

const newConfig = (target: ProjectTarget): string => {
    return `import { defineConfig } from "pluv";

export default defineConfig({
    entry: ${JSON.stringify(DEFAULT_ENTRY)},
    organization: ${JSON.stringify(target.organization)},
    project: ${JSON.stringify(target.project)},
});
`;
};

/**
 * Write organization and project into the pluv config when it is safe.
 * JSON is updated in place. An existing TypeScript or JavaScript config is not rewritten.
 */
export const writeProjectTarget = async (
    cwd: string,
    target: ProjectTarget,
): Promise<WriteProjectTargetResult> => {
    const filePath = findConfigFile(cwd);

    if (!filePath) {
        await writeFile(resolve(cwd, "pluv.config.ts"), newConfig(target));

        return { wrote: true };
    }

    if (filePath.endsWith(".json")) {
        let json: unknown;

        try {
            json = JSON.parse(await readFile(filePath, "utf8"));
        } catch {
            return {
                wrote: false,
                hint: `${basename(filePath)} is not valid JSON and was not updated.`,
            };
        }

        const parsed = ZodJsonObject.safeParse(json);

        if (!parsed.success) {
            return {
                wrote: false,
                hint: `${basename(filePath)} is not a JSON object and was not updated.`,
            };
        }

        const next = {
            ...parsed.data,
            organization: target.organization,
            project: target.project,
        };

        await writeFile(filePath, `${JSON.stringify(next, null, 4)}\n`);

        return { wrote: true };
    }

    return {
        wrote: false,
        hint: projectTargetSaveHint(basename(filePath), target),
    };
};
