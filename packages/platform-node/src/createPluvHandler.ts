import type { InferInitContextType, PluvServer } from "@pluv/io";
import type { BaseUser, InferIOAuthorize, InferIOAuthorizeUser, Maybe, MaybePromise } from "@pluv/types";
import type { Server as HttpServer, IncomingMessage, ServerResponse } from "node:http";
import Url from "node:url";
import { match } from "path-to-regexp";
import type { WebSocket } from "ws";
import { Server as WsServer } from "ws";
import { NodePlatform } from "./NodePlatform";

export type AuthorizeFunctionContext<TPluvServer extends PluvServer<any, any, any, any>> = {
    room: string;
} & InferInitContextType<TPluvServer extends PluvServer<infer IPlatform, any, any, any> ? IPlatform : never>;

export type AuthorizeFunction<TPluvServer extends PluvServer<any, any, any, any>> = (
    ctx: AuthorizeFunctionContext<TPluvServer>,
) => MaybePromise<Maybe<InferIOAuthorizeUser<InferIOAuthorize<TPluvServer>>>>;

export type CreatePluvHandlerConfig<TPluvServer extends PluvServer<any, any, any, any>> = {
    endpoint?: string;
    io: TPluvServer;
    server: HttpServer;
} & (InferIOAuthorizeUser<InferIOAuthorize<TPluvServer>> extends BaseUser
    ? { authorize: AuthorizeFunction<TPluvServer> }
    : { authorize?: undefined });

const handle = (ws: WebSocket) => ({
    invalidEndpoint: () => {
        ws.close(1003, "Invalid WebSocket endpoint");

        return { matched: false };
    },
    invalidRoom: () => {
        ws.close(1003, "Invalid room name");

        return { matched: true };
    },
    invalidToken: () => {
        ws.close(1003, "Invalid authentication token");

        return { matched: true };
    },
});

export type RequestHandler = (req: IncomingMessage, res: ServerResponse, next?: () => void) => void;

export interface WebSocketHandlerResult {
    matched: boolean;
}

export type WebSocketHandler = (ws: WebSocket, req: IncomingMessage) => Promise<WebSocketHandlerResult>;

export interface CreatePluvHandlerResult {
    createWsServer: () => WsServer;
    handler: RequestHandler;
    wsHandler: WebSocketHandler;
}

export const createPluvHandler = <TPluvServer extends PluvServer<NodePlatform, any, any, any>>(
    config: CreatePluvHandlerConfig<TPluvServer>,
): CreatePluvHandlerResult => {
    const { authorize, endpoint = "/api/pluv", io, server } = config;

    if (io._defs.platform._config.registrationMode === "detached") {
        throw new Error("Cannot use createPluvHandler in detached mode for Node.js");
    }

    const wsServer = new WsServer({ server });
    const rooms = new Map<string, ReturnType<typeof io.createRoom>>();

    const getRoom = (roomId: string): ReturnType<typeof io.createRoom> => {
        Array.from(rooms.values()).forEach((room) => {
            if (!room.getSize()) rooms.delete(room.id);
        });

        const existing = rooms.get(roomId);

        if (existing) return existing;

        const newRoom = io.createRoom(roomId, {
            onDestroy: (event) => {
                rooms.delete(event.room);
            },
        });

        rooms.set(roomId, newRoom);

        return newRoom;
    };

    const wsHandler = async (ws: WebSocket, req: IncomingMessage): Promise<WebSocketHandlerResult> => {
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

        const room = getRoom(roomId);

        await room.register(ws, { req, token });

        return { matched: true };
    };

    const createWsServer = () => {
        return wsServer.on("connection", async (ws, req) => {
            await wsHandler(ws, req);
        });
    };

    const handler = async (
        req: IncomingMessage,
        res: ServerResponse,
        next?: () => void,
    ): Promise<ServerResponse | null> => {
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

        const room = parsed.query?.room || undefined;

        if (typeof room !== "string" || !room) {
            res.writeHead(404, { "Content-Type": "text/plain" });
            return res.end("Room does not exist");
        }

        try {
            const user = await authorize({ req, room } as AuthorizeFunctionContext<TPluvServer>);

            if (!user) throw new Error();

            const token = await io.createToken({
                req,
                room,
                user: user as any,
            });

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
