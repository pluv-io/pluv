import { resolve } from "node:path";

const isMissingFile = (error: unknown): boolean => {
    return error instanceof Error && "code" in error && error.code === "ENOENT";
};

/**
 * Load `.env` into this process before `pluv.config.ts` reads `process.env`.
 * A variable already set in the shell is kept. A missing file is ignored.
 */
export const loadDotenv = (cwd: string): void => {
    try {
        process.loadEnvFile(resolve(cwd, ".env"));
    } catch (error) {
        if (isMissingFile(error)) return;

        throw error;
    }
};
