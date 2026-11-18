import { existsSync } from "node:fs";
import { authBase, type ServiceUrls } from "../session/endpoints";
import { requestStatus } from "../session/request";
import { deleteCliSessionFile, readCliSession, sessionFilePath } from "../session/sessionFile";

/** Delete the saved CLI session, and the session row when a token was saved. */
export const runLogout = async (cwd: string, urls?: ServiceUrls): Promise<void> => {
    const filePath = sessionFilePath(cwd);

    if (!filePath || !existsSync(filePath)) return;

    const session = await readCliSession(filePath);

    await deleteCliSessionFile(filePath);

    if (!session) return;

    await requestStatus({
        url: new URL("/api/auth/cli/logout", authBase(urls)),
        method: "POST",
        token: session.token,
        expect: 204,
        error: "The local login was removed, but the session could not be deleted.",
    });
};
