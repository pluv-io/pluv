import { cliRpc } from "../../client";
import type { WhoamiAccount } from "../../schemas";

export type { WhoamiAccount };

/** The account for the saved CLI session. */
export const runWhoami = async (): Promise<WhoamiAccount> => {
    return cliRpc.auth.verify();
};
