import { existsSync } from "node:fs";
import { api } from "../session/api";
import type { ServiceUrls } from "../session/endpoints";
import { deleteCliSessionFile, readCliSession, sessionFilePath } from "../session/sessionFile";

/** Delete the saved CLI session, and the session row when a token was saved. */
export const runLogout = async (cwd: string, urls?: ServiceUrls): Promise<void> => {
    const filePath = sessionFilePath(cwd);

    if (!filePath || !existsSync(filePath)) return;

    const session = await readCliSession(filePath);

    await deleteCliSessionFile(filePath);

    if (!session) return;

    await api
        .client({ cwd, urls, token: session.token })
        .post("/api/auth/cli/logout")
        .expect(204)
        .error("The local login was removed, but the session could not be deleted.")
        .send();
};
