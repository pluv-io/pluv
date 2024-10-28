import { createHmac } from "./createHmac";
import { timingSafeEqual } from "./timingSafeEqual";

export interface VerifyWebhookParams {
    payload: string;
    secret: string;
    signature: string;
}

export const verifyWebhook = async (params: VerifyWebhookParams): Promise<boolean> => {
    const { payload, secret, signature } = params;

    if (!secret || !payload || !signature) {
        throw new Error("Secret, payload and signature are required to verify payload");
    }

    const { hmac } = await createHmac({ payload, secret });

    if (hmac.length !== signature.length) return false;

    const encoder = new TextEncoder();
    const verificationBytes = encoder.encode(hmac);
    const signatureBytes = encoder.encode(signature);

    if (verificationBytes.length !== signatureBytes.length) return false;

    return timingSafeEqual(verificationBytes, signatureBytes);
};
