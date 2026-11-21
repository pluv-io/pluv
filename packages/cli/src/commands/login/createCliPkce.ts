import { createHash, randomBytes } from "node:crypto";

export type CliPkce = {
    challenge: string;
    state: string;
    verifier: string;
};

export const createCliPkce = (): CliPkce => {
    const verifier = randomBytes(32).toString("base64url");
    const challenge = createHash("sha256").update(verifier).digest("base64url");
    const state = randomBytes(32).toString("base64url");

    return { challenge, state, verifier };
};
