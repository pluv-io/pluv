import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";

const MODULE_BYTE_LIMIT = 10 * 1024 * 1024;

const ZodMissingFile = z.object({
    code: z.literal("ENOENT"),
});

/** Read `<distDir>/build/server.js`. An empty file or a file over 10 MB fails here. */
export const readBuiltModule = async (distDir: string): Promise<Uint8Array> => {
    const filePath = join(distDir, "build/server.js");
    let info: { size: number };

    try {
        info = await stat(filePath);
    } catch (caught: unknown) {
        if (ZodMissingFile.safeParse(caught).success) {
            throw new Error("Run pluv build before pluv deploy.", { cause: caught });
        }

        throw caught;
    }

    if (info.size === 0) throw new Error("The built module is empty.");
    if (info.size > MODULE_BYTE_LIMIT) throw new Error("The built module is larger than 10 MB.");

    return await readFile(filePath);
};
