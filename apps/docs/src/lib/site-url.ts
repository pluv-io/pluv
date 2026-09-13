import { env } from "cloudflare:workers";

export const getSiteUrl = (): string => {
    return env.SITE_URL;
};
