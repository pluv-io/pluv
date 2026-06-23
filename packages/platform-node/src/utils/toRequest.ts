import type { IncomingMessage } from "node:http";
import { Readable } from "node:stream";

export type ToRequestOptions = {
    origin?: string;
};

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

export const toRequest = (
    request: Request | IncomingMessage,
    options: ToRequestOptions = {},
): Request => {
    if (request instanceof Request) return request;

    const origin = options.origin ?? inferOrigin(request);
    const url = new URL(request.url ?? "/", origin);
    const method = request.method ?? "GET";

    if (method === "GET" || method === "HEAD") {
        return new Request(url, {
            headers: request.headers as HeadersInit,
            method,
        });
    }

    return new Request(url, {
        body: Readable.toWeb(request) as ReadableStream,
        duplex: "half",
        headers: request.headers as HeadersInit,
        method,
    });
};
