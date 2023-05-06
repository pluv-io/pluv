import type { PluvIO } from "@pluv/io";
import {
    InferIOAuthorize,
    InferIOAuthorizeRequired,
    InferIOAuthorizeUser,
    Maybe,
    MaybePromise,
} from "@pluv/types";
import Http, { IncomingMessage, ServerResponse } from "http";
import { match } from "path-to-regexp";
import Url from "url";
import WebSocket from "ws";
import { NodePlatform } from "./NodePlatform";

export interface AuthorizeFunctionContext {
    req: Http.IncomingMessage;
    res: Http.ServerResponse;
    roomId: string;
}
export type AuthorizeFunction<TPluv extends PluvIO<NodePlatform>> = (
    ctx: AuthorizeFunctionContext
) => MaybePromise<Maybe<InferIOAuthorizeUser<InferIOAuthorize<TPluv>>>>;

export type CreatePluvHandlerConfig<TPluv extends PluvIO<NodePlatform>> = {
    endpoint?: string;
    io: TPluv;
    server: Http.Server;
} & (InferIOAuthorizeRequired<InferIOAuthorize<TPluv>> extends true
    ? { authorize: AuthorizeFunction<TPluv> }
    : { authorize?: undefined });

const handle = (ws: WebSocket.WebSocket) => ({
    invalidEndpoint: () => ws.close(1011, "Invalid WebSocket endpoint"),
    invalidRoom: () => ws.close(1011, "Invalid room name"),
    invalidToken: () => ws.close(1011, "Invalid authentication token"),
});

export type RequestHandler = (
    req: IncomingMessage,
    res: ServerResponse,
    next?: () => void
) => void;

export const createPluvHandler = <
    TPluv extends PluvIO<NodePlatform, any, any, any, any, any, any>
>(
    config: CreatePluvHandlerConfig<TPluv>
): RequestHandler => {
    const { authorize, endpoint = "/api/pluv", io, server } = config;

    const wsServer = new WebSocket.Server({ server });

    wsServer.on("connection", async (ws, req) => {
        const url = req.url;
        const onError = handle(ws);

        if (!url) return onError.invalidEndpoint();

        const parsed = Url.parse(url, true);
        const { pathname } = parsed;

        if (!pathname) return onError.invalidEndpoint();

        const matcher = match<{ roomId: string }>(`${endpoint}/room/:roomId`);
        const matched = matcher(pathname);

        if (!matched) return onError.invalidEndpoint();

        const { roomId } = matched.params;

        if (!roomId) return onError.invalidRoom();

        const token = parsed.query?.token || undefined;

        if (Array.isArray(token)) return onError.invalidToken();

        const room = io.getRoom(roomId);

        await room.register(ws, { token });
    });

    const handler = async (req: IncomingMessage, res: ServerResponse) => {
        if (!authorize) return;
        if (req.method !== "GET") return;

        const url = req.url;

        if (!url) return;

        const parsed = Url.parse(url, true);
        const { pathname } = parsed;

        if (!pathname) return;

        const matcher = match<{}>(`${endpoint}/authorize`);
        const matched = matcher(pathname);

        if (!matched) return;

        const roomId = parsed.query?.room || undefined;

        if (typeof roomId !== "string" || !roomId) {
            res.writeHead(404, { "Content-Type": "text/plain" });
            res.end("Room does not exist");

            return;
        }

        try {
            const user = await authorize({ res, req, roomId });

            if (!user) throw new Error();

            const token = await io.createToken({ room: roomId, user });

            res.writeHead(200, { "Content-Type": "text/plain" });
            res.end(token);
        } catch (err) {
            res.writeHead(403, { "Content-Type": "text/plain" });
            res.end(err instanceof Error ? err.message : "Unauthorized");
        }
    };

    return async (
        req: IncomingMessage,
        res: ServerResponse,
        next?: () => void
    ) => Promise.resolve(handler(req, res)).catch(next);
};
