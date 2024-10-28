import type { webcrypto } from "crypto";
import { getCrypto } from "./getCrypto";

export interface CreateHmacParams {
    payload: string;
    secret: string;
}

export type CreateHmacResult = {
    algorithm: "sha256";
    hmac: string;
};

export const createHmac = async (params: CreateHmacParams): Promise<CreateHmacResult> => {
    const { payload, secret } = params;

    if (!payload || !secret) throw new Error("Secret and payload are required to sign payload");

    const encoder = new TextEncoder();
    const keyBytes = encoder.encode(secret);

    const crypto = getCrypto();

    const algorithm: webcrypto.HmacImportParams = { name: "HMAC", hash: { name: "SHA-256" } };
    const extractable = false;

    const key = await crypto.subtle.importKey("raw", keyBytes, algorithm, extractable, ["sign", "verify"]);
    const payloadBytes = encoder.encode(payload);

    const signature = await crypto.subtle.sign("HMAC", key, payloadBytes);

    // Convert the signature to a hex string
    const hmac = Array.from(new Uint8Array(signature))
        .map((b) => ("0" + b.toString(16)).slice(-2))
        .join("");

    return { algorithm: "sha256", hmac };
};
