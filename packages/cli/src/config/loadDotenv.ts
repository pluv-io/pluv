import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import dotenv from "dotenv";

const readEnvFile = (filePath: string): Record<string, string> => {
    if (!existsSync(filePath)) return {};

    return dotenv.parse(readFileSync(filePath));
};

/**
 * Load project env files into this process before config or hosted API calls.
 * Order matches common frontend tooling: `.env`, then `.env.local` (local wins on duplicate keys).
 * Variables already set in the shell are never overwritten.
 */
export const loadDotenv = (cwd: string): void => {
    const merged = {
        ...readEnvFile(resolve(cwd, ".env")),
        ...readEnvFile(resolve(cwd, ".env.local")),
    };

    for (const [key, value] of Object.entries(merged)) {
        if (process.env[key] !== undefined) continue;

        process.env[key] = value;
    }
};