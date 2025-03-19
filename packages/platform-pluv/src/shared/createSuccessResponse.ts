import type { Context } from "hono";
import type { BlankEnv, BlankInput } from "hono/types";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { ZodEventResponse } from "../schemas";
import type { EventResponse } from "../types";

export interface CreateSuccessResponseParams<TStatus extends ContentfulStatusCode> {
    data: EventResponse;
    status?: TStatus;
}

export const createSuccessResponse = <TStatus extends ContentfulStatusCode = 200>(
    c: Context<BlankEnv, "/", BlankInput>,
    data: EventResponse,
    status: TStatus = 200 as TStatus,
) => {
    return c.json(
        {
            ok: true,
            data: ZodEventResponse.parse(data),
        },
        status,
    );
};
