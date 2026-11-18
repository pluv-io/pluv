import { readCliSession, sessionFilePath } from "../session/sessionFile";

const loginRequired = "Run pluv login.";

const readEnv = (name: string): string | undefined => {
    const value = process.env[name];

    return value && value.length > 0 ? value : undefined;
};

/** The session token from PLUV_SESSION_TOKEN, or from the cache file when that env var is unset. */
export const deploySessionToken = async (cwd: string): Promise<string> => {
    const fromEnv = readEnv("PLUV_SESSION_TOKEN");

    if (fromEnv && fromEnv.length > 0) return fromEnv;

    const filePath = sessionFilePath(cwd);

    if (!filePath) throw new Error(loginRequired);

    const session = await readCliSession(filePath);

    if (!session) throw new Error(loginRequired);

    const expiresAt = Date.parse(session.expiresAt);

    if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
        throw new Error("The saved login expired. Run pluv login.");
    }

    return session.token;
};
