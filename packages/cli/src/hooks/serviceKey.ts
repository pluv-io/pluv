import type { ServiceUrls } from "../client";

/** Query-key parts for the configured API and auth URLs. */
export const serviceKey = (urls: ServiceUrls): Array<string | null> => {
    return [urls.apiUrl, urls.authUrl];
};
