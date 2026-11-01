export const SANDBOX_SECRET = "sandbox-secret";

export const hasSandboxSecret = (request: Request): boolean => {
    return request.headers.get("x-sandbox-secret") === SANDBOX_SECRET;
};
