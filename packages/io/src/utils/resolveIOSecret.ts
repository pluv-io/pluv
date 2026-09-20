/**
 * Resolve a static or context-function JWT secret.
 */
export const resolveIOSecret = (
    secret: string | ((context: any) => string) | undefined,
    context: any,
): string | undefined => {
    if (typeof secret === "function") return secret(context);

    return secret;
};
