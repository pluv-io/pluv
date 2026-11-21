import { readCliSession, sessionFilePath } from "./sessionFile";

const readEnv = (name: string): string | undefined => {
    const value = process.env[name];

    return value && value.length > 0 ? value : undefined;
};

/** The session token from PLUV_SESSION_TOKEN, or from the cache file when that env var is unset. */
export const readSessionToken = async (cwd: string): Promise<string | undefined> => {
    const fromEnv = readEnv("PLUV_SESSION_TOKEN");

    if (fromEnv) return fromEnv;

    const filePath = sessionFilePath(cwd);

    if (!filePath) return undefined;

    return (await readCliSession(filePath))?.token;
};
