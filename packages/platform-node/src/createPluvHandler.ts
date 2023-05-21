import type { PluvIO } from "@pluv/io";
import {
    InferIOAuthorize,
    InferIOAuthorizeRequired,
    InferIOAuthorizeUser,
    Maybe,
    MaybePromise,
} from "@pluv/types";
import Http from "http";
import { match } from "path-to-regexp";
import Url from "url";
import WS from "ws";
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

const handle = (ws: WS.WebSocket) => ({
    invalidEndpoint: () => {
        ws.close(1011, "Invalid WebSocket endpoint");

        return { matched: false };
    },
    invalidRoom: () => {
        ws.close(1011, "Invalid room name");

        return { matched: true };
    },
    invalidToken: () => {
        ws.close(1011, "Invalid authentication token");

        return { matched: true };
    },
});

export type RequestHandler = (
    req: Http.IncomingMessage,
    res: Http.ServerResponse,
    next?: () => void
) => void;

export interface WebSocketHandlerResult {
    matched: boolean;
}

export type WebSocketHandler = (
    ws: WS.WebSocket,
    req: Http.IncomingMessage
) => Promise<WebSocketHandlerResult>;

export interface CreatePluvHandlerResult {
    createWsServer: () => WS.Server<WS.WebSocket>;
    handler: RequestHandler;
    wsHandler: WebSocketHandler;
}

export const createPluvHandler = <
    TPluv extends PluvIO<NodePlatform, any, any, any, any, any, any>
>(
    config: CreatePluvHandlerConfig<TPluv>
): CreatePluvHandlerResult => {
    const { authorize, endpoint = "/api/pluv", io, server } = config;

    const wsServer = new WS.Server({ server });

    const wsHandler = async (
        ws: WS.WebSocket,
        req: Http.IncomingMessage
    ): Promise<WebSocketHandlerResult> => {
        const url = req.url;
        const onError = handle(ws);

        if (!url) {
            onError.invalidEndpoint();

            return { matched: false };
        }

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

        const room = io.getRoom(roomId, { req });

        await room.register(ws, { req, token });

        return { matched: true };
    };

    const createWsServer = () => {
        return wsServer.on("connection", async (ws, req) => {
            await wsHandler(ws, req);
        });
    };

    const handler = async (
        req: Http.IncomingMessage,
        res: Http.ServerResponse,
        next?: () => void
    ): Promise<Http.ServerResponse | null> => {
        if (!authorize) return next?.() ?? null;
        if (req.method !== "GET") return next?.() ?? null;

        const url = req.url;

        if (!url) return next?.() ?? null;

        const parsed = Url.parse(url, true);
        const { pathname } = parsed;

        if (!pathname) return next?.() ?? null;

        const matcher = match<{}>(`${endpoint}/authorize`);
        const matched = matcher(pathname);

        if (!matched) return next?.() ?? null;

        const roomId = parsed.query?.room || undefined;

        if (typeof roomId !== "string" || !roomId) {
            res.writeHead(404, { "Content-Type": "text/plain" });
            return res.end("Room does not exist");
        }

        try {
            const user = await authorize({ res, req, roomId });

            if (!user) throw new Error();

            const token = await io.createToken({ room: roomId, user });

            res.writeHead(200, { "Content-Type": "text/plain" });
            return res.end(token);
        } catch (err) {
            res.writeHead(403, { "Content-Type": "text/plain" });
            return res.end(err instanceof Error ? err.message : "Unauthorized");
        }
    };

    return {
        createWsServer,
        handler,
        wsHandler,
    };
};
