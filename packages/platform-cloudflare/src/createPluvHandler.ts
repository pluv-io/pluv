import { IORoom, PluvIO } from "@pluv/io";
import {
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
export type AuthorizeFunction<TPluv extends PluvIO<CloudflarePlatform>> = (
    ctx: AuthorizeFunctionContext,
) => MaybePromise<Maybe<InferIOAuthorizeUser<InferIOAuthorize<TPluv>>>>;

export type CreatePluvHandlerConfig<
    TPluv extends PluvIO<CloudflarePlatform>,
    TEnv extends Record<string, any>,
> = {
    binding: string;
    endpoint?: string;
    modify?: (
        request: Request,
        response: Response,
        env: TEnv,
    ) => MaybePromise<Response>;
    io: TPluv;
} & (InferIOAuthorizeRequired<InferIOAuthorize<TPluv>> extends true
    ? { authorize: AuthorizeFunction<TPluv> }
    : { authorize?: undefined });

export type PluvHandlerFetch<TEnv extends Record<string, any> = {}> = (
    request: Request,
    env: TEnv,
) => Promise<Response | null>;

export interface CreatePluvHandlerResult<
    TEnv extends Record<string, any> = {},
> {
    DurableObject: {
        new (state: DurableObjectState, env: TEnv): DurableObject;
    };
    fetch: PluvHandlerFetch<TEnv>;
    handler: ExportedHandler<TEnv>;
}

type InferCloudflarePluvHandlerEnv<
    TPluv extends PluvIO<CloudflarePlatform, any, any, any, any, any, any>,
> =
    TPluv extends PluvIO<
        CloudflarePlatform<infer IEnv>,
        any,
        any,
        any,
        any,
        any,
        any
    >
        ? IEnv
        : {};

export const createPluvHandler = <
    TPluv extends PluvIO<CloudflarePlatform, any, any, any, any, any, any>,
>(
    config: CreatePluvHandlerConfig<
        TPluv,
        Id<InferCloudflarePluvHandlerEnv<TPluv>>
    >,
): CreatePluvHandlerResult<Id<InferCloudflarePluvHandlerEnv<TPluv>>> => {
    const { authorize, binding, endpoint = "/api/pluv", modify, io } = config;

    const DurableObject = class implements DurableObject {
        private _env: Id<InferCloudflarePluvHandlerEnv<TPluv>>;
        private _io: IORoom<CloudflarePlatform>;

        constructor(
            state: DurableObjectState,
            env: Id<InferCloudflarePluvHandlerEnv<TPluv>>,
        ) {
            this._env = env;
            this._io = io.getRoom(state.id.toString(), { env });
        }

        webSocketClose(
            ws: WebSocket,
            code: number,
            reason: string,
            wasClean: boolean,
        ): void | Promise<void> {}

        webSocketError(ws: WebSocket, error: unknown): void | Promise<void> {}

        webSocketMessage(
            ws: WebSocket,
            message: string | ArrayBuffer,
        ): void | Promise<void> {}

        async fetch(
            request: Request<any, CfProperties<any>>,
        ): Promise<Response> {
            const isWSRequest = request.headers.get("Upgrade") === "websocket";

            if (!isWSRequest) {
                return new Response("Expected websocket", { status: 400 });
            }

            const { 0: client, 1: server } = new WebSocketPair();

            const token = new URL(request.url).searchParams.get("token");

            await this._io.register(server, {
                env: this._env,
                request,
                token,
            });

            return new Response(null, { status: 101, webSocket: client });
        }
    };

    const getDurableObjectNamespace = (
        env: Id<InferCloudflarePluvHandlerEnv<TPluv>>,
    ): DurableObjectNamespace => {
        const namespace = env[
            binding as keyof typeof env
        ] as DurableObjectNamespace;

        if (!namespace) {
            throw new Error(`Could not find DurableObject binding: ${binding}`);
        }

        return namespace;
    };

    const authHandler: PluvHandlerFetch<
        Id<InferCloudflarePluvHandlerEnv<TPluv>>
    > = async (request, env) => {
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
                room: durableObjectId.toString(),
                user,
            });

            return new Response(token, {
                headers: { "Content-Type": "text/plain" },
                status: 200,
            });
        } catch (err) {
            return new Response(
                err instanceof Error ? err.message : "Unauthorized",
                {
                    headers: { "Content-Type": "text/plain" },
                    status: 403,
                },
            );
        }
    };

    const roomHandler: PluvHandlerFetch<
        Id<InferCloudflarePluvHandlerEnv<TPluv>>
    > = async (request, env) => {
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

    const fetch: PluvHandlerFetch<
        Id<InferCloudflarePluvHandlerEnv<TPluv>>
    > = async (request, env) => {
        return [authHandler, roomHandler].reduce((promise, current) => {
            return promise.then((value) => value ?? current(request, env));
        }, Promise.resolve<Response | null>(null));
    };

    const handler: ExportedHandler<Id<InferCloudflarePluvHandlerEnv<TPluv>>> = {
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
