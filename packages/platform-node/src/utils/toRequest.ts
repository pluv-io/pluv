import type { IncomingMessage } from "node:http";
import { Readable } from "node:stream";

const getHeader = (incoming: IncomingMessage, name: string): string | undefined => {
    const value = incoming.headers[name];

    if (Array.isArray(value)) return value[0];

    return value;
};

const inferOrigin = (incoming: IncomingMessage): string => {
    const host =
        getHeader(incoming, "x-forwarded-host") ?? getHeader(incoming, "host") ?? "localhost";
    const forwardedProto = getHeader(incoming, "x-forwarded-proto");
    const protocol =
        forwardedProto ??
        ((incoming.socket as { encrypted?: boolean }).encrypted ? "https" : "http");

    return `${protocol}://${host}`;
};

const toHeaders = (incoming: IncomingMessage): Headers => {
    const headers = new Headers();

    for (const [key, value] of Object.entries(incoming.headers)) {
        if (value == null) continue;

        if (Array.isArray(value)) {
            for (const item of value) headers.append(key, item);

            continue;
        }

        headers.append(key, value);
    }

    return headers;
};

export type ToRequestOptions = {
    origin?: string;
};

export const toRequest = (
    request: Request | IncomingMessage,
    options: ToRequestOptions = {},
): Request => {
    if (request instanceof Request) return request;

    const origin = options.origin ?? inferOrigin(request);
    const url = new URL(request.url ?? "/", origin);
    const method = request.method ?? "GET";
    const headers = toHeaders(request);

    if (method === "GET" || method === "HEAD") {
        return new Request(url, {
            headers,
            method,
        });
    }

    return new Request(url, {
        body: Readable.toWeb(request) as ReadableStream,
        duplex: "half",
        headers,
        method,
    });
};
