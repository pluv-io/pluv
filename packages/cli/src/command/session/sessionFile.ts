import { existsSync } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { z } from "zod";

export const ZodCliSession = z.object({
    expiresAt: z.string().min(1),
    token: z.string().min(1),
});

export type CliSession = z.infer<typeof ZodCliSession>;

/** The nearest `node_modules/.cache/pluv/session.json`, walking up from `cwd`. */
export const sessionFilePath = (cwd: string): string | null => {
    let dir = resolve(cwd);

    for (;;) {
        if (existsSync(join(dir, "node_modules"))) {
            return join(dir, "node_modules/.cache/pluv/session.json");
        }

        const parent = dirname(dir);

        if (parent === dir) return null;

        dir = parent;
    }
};

export const readCliSession = async (filePath: string): Promise<CliSession | null> => {
    let text: string;

    try {
        text = await readFile(filePath, "utf8");
    } catch {
        return null;
    }

    let json: unknown;

    try {
        json = JSON.parse(text);
    } catch {
        return null;
    }

    const parsed = ZodCliSession.safeParse(json);

    return parsed.success ? parsed.data : null;
};

export const writeCliSession = async (filePath: string, session: CliSession): Promise<void> => {
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, `${JSON.stringify(session, null, 2)}\n`);
};

export const deleteCliSessionFile = async (filePath: string): Promise<void> => {
    await rm(filePath, { force: true });
};
