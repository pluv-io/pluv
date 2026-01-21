import type { Context } from "hono";
import type { BlankEnv, BlankInput } from "hono/types";
import type { ContentfulStatusCode } from "hono/utils/http-status";

export const createErrorResponse = <TStatus extends ContentfulStatusCode>(
    c: Context<BlankEnv, "/", BlankInput>,
    error: { message: string },
    status: TStatus,
    event: string = "unknown",
) => {
    return c.json(
        {
            ok: false,
            error: { message: error.message },
        },
        status,
        { "x-pluv-event": event },
    );
};
