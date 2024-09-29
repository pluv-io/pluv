import type { IORoom, PluvServer } from "@pluv/io";
import type {
    Id,
    InferIOAuthorize,
    InferIOAuthorizeRequired,
    InferIOAuthorizeUser,
    Maybe,
    MaybePromise,
} from "@pluv/types";
import { match } from "path-to-regexp";
import { CloudflarePlatform } from "./CloudflarePlatform";

export interface AuthorizeFunctionContext {
    request: Request<any, CfProperties<any>>;
    roomId: string;
}
export type AuthorizeFunction<TPluvServer extends PluvServer<CloudflarePlatform, any, any, any>> = (
    ctx: AuthorizeFunctionContext,
) => MaybePromise<Maybe<InferIOAuthorizeUser<InferIOAuthorize<TPluvServer>>>>;

export type CreatePluvHandlerConfig<
    TPluvServer extends PluvServer<CloudflarePlatform, any, any, any>,
    TEnv extends Record<string, any>,
> = {
    binding: string;
    endpoint?: string;
    modify?: (request: Request, response: Response, env: TEnv) => MaybePromise<Response>;
    io: TPluvServer;
} & (InferIOAuthorizeRequired<InferIOAuthorize<TPluvServer>> extends true
    ? { authorize: AuthorizeFunction<TPluvServer> }
    : { authorize?: undefined });

export type PluvHandlerFetch<TEnv extends Record<string, any> = {}> = (
    request: Request,
    env: TEnv,
) => Promise<Response | null>;

export interface CreatePluvHandlerResult<TEnv extends Record<string, any> = {}> {
    DurableObject: {
        new (state: DurableObjectState, env: TEnv): DurableObject;
    };
    fetch: PluvHandlerFetch<TEnv>;
    handler: ExportedHandler<TEnv>;
}

type InferCloudflarePluvHandlerEnv<TPluvServer extends PluvServer<CloudflarePlatform, any, any, any>> =
    TPluvServer extends PluvServer<CloudflarePlatform<infer IEnv>, any, any, any> ? IEnv : {};

export const createPluvHandler = <TPluvServer extends PluvServer<CloudflarePlatform, any, any, any>>(
    config: CreatePluvHandlerConfig<TPluvServer, Id<InferCloudflarePluvHandlerEnv<TPluvServer>>>,
): CreatePluvHandlerResult<Id<InferCloudflarePluvHandlerEnv<TPluvServer>>> => {
    const { authorize, binding, endpoint = "/api/pluv", modify, io } = config;

    const DurableObject = class implements DurableObject {
        private _env: Id<InferCloudflarePluvHandlerEnv<TPluvServer>>;
        private _room: IORoom<CloudflarePlatform>;

        constructor(state: DurableObjectState, env: Id<InferCloudflarePluvHandlerEnv<TPluvServer>>) {
            this._env = env;
            this._room = io.createRoom(state.id.toString(), { env, state });
        }

        public async webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean): Promise<void> {
            if (io._defs.platform._registrationMode !== "detached") return;

            const handler = this._room.onClose(ws);

            await handler({ code, reason });
        }

        public async webSocketError(ws: WebSocket, error: unknown): Promise<void> {
            if (io._defs.platform._registrationMode !== "detached") return;

            const handler = this._room.onError(ws);
            const eventError = error instanceof Error ? error : new Error("Internal Error");

            await handler({ error: eventError, message: eventError.message });
        }

        public async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
            if (io._defs.platform._registrationMode !== "detached") return;

            const handler = this._room.onMessage(ws);

            await handler({ data: message });
        }

        async fetch(request: Request<any, CfProperties<any>>): Promise<Response> {
            const isWSRequest = request.headers.get("Upgrade") === "websocket";

            if (!isWSRequest) {
                return new Response("Expected websocket", { status: 400 });
            }

            const { 0: client, 1: server } = new WebSocketPair();
            const token = new URL(request.url).searchParams.get("token");

            await this._room.register(server, { env: this._env, request, token });

            return new Response(null, { status: 101, webSocket: client });
        }
    };

    const getDurableObjectNamespace = (env: Id<InferCloudflarePluvHandlerEnv<TPluvServer>>): DurableObjectNamespace => {
        const namespace = env[binding as keyof typeof env] as DurableObjectNamespace;

        if (!namespace) {
            throw new Error(`Could not find DurableObject binding: ${binding}`);
        }

        return namespace;
    };

    const authHandler: PluvHandlerFetch<Id<InferCloudflarePluvHandlerEnv<TPluvServer>>> = async (request, env) => {
        if (!authorize) return null;

        const { pathname, searchParams } = new URL(request.url);
        const matcher = match<{}>(`${endpoint}/authorize`);
        const matched = matcher(pathname);

        if (!matched) return null;

        const roomId = searchParams.get("room");

        if (!roomId) {
            return new Response("Not found", {
                headers: { "Content-Type": "text/plain" },
                status: 404,
            });
        }

        try {
            const user = await authorize({ request, roomId });

            if (!user) throw new Error();

            const namespace = getDurableObjectNamespace(env);
            const durableObjectId = namespace.idFromName(roomId);

            const token = await io.createToken({
                env,
                room: durableObjectId.toString(),
                user,
                request,
            });

            return new Response(token, {
                headers: { "Content-Type": "text/plain" },
                status: 200,
            });
        } catch (err) {
            return new Response(err instanceof Error ? err.message : "Unauthorized", {
                headers: { "Content-Type": "text/plain" },
                status: 403,
            });
        }
    };

    const roomHandler: PluvHandlerFetch<Id<InferCloudflarePluvHandlerEnv<TPluvServer>>> = async (request, env) => {
        const { pathname } = new URL(request.url);
        const matcher = match<{ roomId: string }>(`${endpoint}/room/:roomId`);
        const matched = matcher(pathname);

        if (!matched) return null;

        const { roomId } = matched.params;

        if (!roomId) {
            return new Response("Not found", {
                headers: { "Content-Type": "text/plain" },
                status: 404,
            });
        }

        const namespace = getDurableObjectNamespace(env);
        const durableObjectId = namespace.idFromName(roomId);
        const room = namespace.get(durableObjectId);

        return room.fetch(request);
    };

    const fetch: PluvHandlerFetch<Id<InferCloudflarePluvHandlerEnv<TPluvServer>>> = async (request, env) => {
        return [authHandler, roomHandler].reduce(async (promise, current) => {
            return await promise.then(async (value) => value ?? (await current(request, env)));
        }, Promise.resolve<Response | null>(null));
    };

    const handler: ExportedHandler<Id<InferCloudflarePluvHandlerEnv<TPluvServer>>> = {
        fetch: async (request, env) => {
            const response =
                (await fetch(request, env)) ??
                new Response("Not Found", {
                    headers: { "Content-Type": "text/plain" },
                    status: 404,
                });

            return modify?.(request, response, env) ?? response;
        },
    };

    return { fetch, DurableObject, handler };
};
