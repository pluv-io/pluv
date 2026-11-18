import { z } from "zod";
import { deploySessionToken } from "../deploy/deploySessionToken";
import { authBase, type ServiceUrls } from "../session/endpoints";
import { exchangeSessionJwt } from "../session/exchangeSessionJwt";
import { requestJson } from "../session/request";

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
    const token = await deploySessionToken(cwd);
    const jwt = await exchangeSessionJwt(token, urls);
    const body = await requestJson({
        url: new URL("/api/auth/verify", authBase(urls)),
        token: jwt,
        schema: ZodWhoami,
        error: "The saved login expired. Run pluv login.",
    });

    if (!body.user) throw new Error("The saved login expired. Run pluv login.");

    return body.user;
};
