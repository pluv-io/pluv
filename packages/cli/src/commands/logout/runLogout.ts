import { existsSync } from "node:fs";
import { cliRpc } from "../../client";
import { deleteCliSessionFile, readCliSession, sessionFilePath } from "../../session";

/** Delete the saved CLI session, and the session row when a token was saved. */
export const runLogout = async (cwd: string): Promise<void> => {
    const filePath = sessionFilePath(cwd);

    if (!filePath || !existsSync(filePath)) return;

    const session = await readCliSession(filePath);

    if (session) await cliRpc.auth.cliLogout();

    await deleteCliSessionFile(filePath);
};
