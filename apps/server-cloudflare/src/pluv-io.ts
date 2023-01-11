import { createIO } from "@pluv/io";
import { platformCloudflare } from "@pluv/platform-cloudflare";

export const io = createIO({
    platform: platformCloudflare(),
});
