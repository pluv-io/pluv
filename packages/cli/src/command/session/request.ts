import type { z } from "zod";

type Method = "GET" | "POST";

type RequestError = string | ((status: number, body: unknown) => string);

type RequestParams = {
    url: URL;
    method?: Method;
    token?: string;
    json?: unknown;
};

const messageFor = (error: RequestError, status: number, body: unknown): string => {
    return typeof error === "function" ? error(status, body) : error;
};

const send = async (params: RequestParams): Promise<{ status: number; body: unknown }> => {
    const headers = new Headers();

    if (params.token) headers.set("authorization", `Bearer ${params.token}`);
    if (params.json !== undefined) headers.set("content-type", "application/json");

    const response = await fetch(params.url, {
        method: params.method ?? "GET",
        headers,
        body: params.json !== undefined ? JSON.stringify(params.json) : undefined,
    });

    return {
        status: response.status,
        body: await response.json().catch(() => null),
    };
};

/** JSON request. Throws when the response is not ok, or the body does not match `schema`. */
export const requestJson = async <T>(
    params: RequestParams & {
        schema: z.ZodType<T>;
        error: RequestError;
        /** Used when the body does not match `schema`. Defaults to `error`. */
        invalid?: string;
    },
): Promise<T> => {
    const { status, body } = await send(params);

    if (status < 200 || status >= 300) {
        throw new Error(messageFor(params.error, status, body));
    }

    const parsed = params.schema.safeParse(body);

    if (!parsed.success) {
        throw new Error(params.invalid ?? messageFor(params.error, status, body));
    }

    return parsed.data;
};

/** Request that succeeds only at one status. The body is ignored. */
export const requestStatus = async (
    params: RequestParams & { expect: number; error: string },
): Promise<void> => {
    const { status } = await send(params);

    if (status !== params.expect) throw new Error(params.error);
};
