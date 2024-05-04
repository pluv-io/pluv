import { CloudflarePlatform } from "./CloudflarePlatform";

export const platformCloudflare = <TEnv extends Record<string, any> = {}>(): CloudflarePlatform<TEnv> => {
    return new CloudflarePlatform<TEnv>();
};
