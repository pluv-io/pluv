import { z } from "zod";
import { api } from "../session/api";
import type { ServiceUrls } from "../session/endpoints";

const ZodWhoami = z.object({
    user: z
        .object({
            email: z.string().min(1),
            id: z.string().min(1),
            name: z.string(),
        })
        .nullable(),
});

export type WhoamiAccount = {
    email: string;
    id: string;
    name: string;
};

/** The account for the saved CLI session. */
export const runWhoami = async (cwd: string, urls?: ServiceUrls): Promise<WhoamiAccount> => {
    const body = await api
        .client({ cwd, urls })
        .get("/api/auth/verify")
        .output(ZodWhoami)
        .error("The saved login expired. Run pluv login.")
        .send();

    if (!body.user) throw new Error("The saved login expired. Run pluv login.");

    return body.user;
};
