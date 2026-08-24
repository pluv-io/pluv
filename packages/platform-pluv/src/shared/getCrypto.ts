export const getCrypto = (): Crypto => {
    if (typeof globalThis.crypto !== "undefined") {
        return globalThis.crypto;
    }

    throw new Error("Missing Web Crypto API (globalThis.crypto)");
};
