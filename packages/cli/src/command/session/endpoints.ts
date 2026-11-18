import type { PluvConfig } from "../../schemas";

const DEFAULT_API_URL = "https://api.pluv.io";
const DEFAULT_APP_URL = "https://app.pluv.io";
const DEFAULT_AUTH_URL = "https://auth.pluv.io";

export type ServiceUrls = NonNullable<PluvConfig["~"]>;

const configured = (name: string, fromConfig: string | undefined, fallback: string): string => {
    const value = process.env[name];

    if (value && value.length > 0) return value;
    if (fromConfig && fromConfig.length > 0) return fromConfig;

    return fallback;
};

export const apiBase = (urls?: ServiceUrls): string => {
    return configured("PLUV_API_URL", urls?.apiUrl, DEFAULT_API_URL);
};

export const appBase = (urls?: ServiceUrls): string => {
    return configured("PLUV_APP_URL", urls?.appUrl, DEFAULT_APP_URL);
};

export const authBase = (urls?: ServiceUrls): string => {
    return configured("PLUV_AUTH_URL", urls?.authUrl, DEFAULT_AUTH_URL);
};
