import type { CreateHmacParams } from "./createHmac";
import { createHmac } from "./createHmac";

export type SignWebhookParams = CreateHmacParams;

export const signWebhook = async (params: SignWebhookParams): Promise<string> => {
    const { algorithm, hmac } = await createHmac(params);

    return `${algorithm}=${hmac}`;
};
