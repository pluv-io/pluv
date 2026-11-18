import { z } from "zod";
import { authBase, type ServiceUrls } from "./endpoints";
import { requestJson } from "./request";

const ZodSessionJwt = z.object({
    jwt: z.string().min(1),
});

/** Exchange the CLI session token for a 60-second JWT. Does not renew the session. */
export const exchangeSessionJwt = async (token: string, urls?: ServiceUrls): Promise<string> => {
    const body = await requestJson({
        url: new URL("/api/auth/session/jwt", authBase(urls)),
        method: "POST",
        token,
        schema: ZodSessionJwt,
        error: "The saved login expired. Run pluv login.",
    });

    return body.jwt;
};
