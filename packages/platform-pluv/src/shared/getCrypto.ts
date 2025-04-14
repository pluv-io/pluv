import type { webcrypto } from "crypto";

export const getCrypto = (): webcrypto.Crypto => {
    if (typeof crypto !== "undefined") {
        // In a browser or Web Worker (including Cloudflare Workers)
        return crypto;
    }

    if (typeof require === "function") {
        // In Node.js
        // Node 15+ supports `crypto.webcrypto`
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        return require("node:crypto").webcrypto as webcrypto.Crypto;
    }

    throw new Error("Missing crypto module");
};
