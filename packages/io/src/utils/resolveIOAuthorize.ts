import type { PluvIOAuthorize, ResolvedPluvIOAuthorize } from "../types";

/**
 * Resolve a static or context-function authorize config to its concrete shape.
 */
export const resolveIOAuthorize = <TContext>(
    authorize: PluvIOAuthorize<any, any, TContext>,
    context: TContext,
): ResolvedPluvIOAuthorize<any, any> => {
    if (typeof authorize === "function") return authorize(context);

    return authorize;
};
