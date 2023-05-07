import { IORoom, PluvIO } from "@pluv/io";
import {
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
    ctx: AuthorizeFunctionContext
) => MaybePromise<Maybe<InferIOAuthorizeUser<InferIOAuthorize<TPluv>>>>;

export type CreatePluvHandlerConfig<
    TPluv extends PluvIO<CloudflarePlatform>,
    TBinding extends string
> = {
    binding: TBinding;
    endpoint?: string;
    modify?: (
        request: Request,
        response: Response,
        env: Record<TBinding, DurableObjectNamespace>
    ) => MaybePromise<Response>;
    io: TPluv;
} & (InferIOAuthorizeRequired<InferIOAuthorize<TPluv>> extends true
    ? { authorize: AuthorizeFunction<TPluv> }
    : { authorize?: undefined });

export type PluvHandlerFetch<
    TEnv extends Record<string, DurableObjectNamespace> = {}
> = (request: Request, env: TEnv) => Promise<Response | null>;

export interface CreatePluvHandlerResult<
    TEnv extends Record<string, DurableObjectNamespace> = {}
> {
    fetch: PluvHandlerFetch<TEnv>;
    DurableObject: { new (state: DurableObjectState): DurableObject };
    handler: ExportedHandler<TEnv>;
}

export const createPluvHandler = <
    TPluv extends PluvIO<CloudflarePlatform, any, any, any, any, any, any>,
    TBinding extends string
>(
    config: CreatePluvHandlerConfig<TPluv, TBinding>
): CreatePluvHandlerResult<Record<TBinding, DurableObjectNamespace>> => {
    const { authorize, binding, endpoint = "/api/pluv", modify, io } = config;

    const DurableObject = class implements DurableObject {
        private _io: IORoom<CloudflarePlatform>;

        constructor(state: DurableObjectState) {
            this._io = io.getRoom(state.id.toString());
        }

        async fetch(
            request: Request<any, CfProperties<any>>
        ): Promise<Response> {
            const isWSRequest = request.headers.get("Upgrade") === "websocket";

            if (!isWSRequest) {
                return new Response("Expected websocket", { status: 400 });
            }

            const { 0: client, 1: server } = new WebSocketPair();

            const token = new URL(request.url).searchParams.get("token");

            await this._io.register(server, { token });

            return new Response(null, { status: 101, webSocket: client });
        }
    };

    const getDurableObjectNamespace = (
        env: Record<TBinding, DurableObjectNamespace>
    ): DurableObjectNamespace => {
        const namespace = env[binding];

        if (!namespace) {
            throw new Error(`Could not find DurableObject binding: ${binding}`);
        }

        return namespace;
    };

    const authHandler: PluvHandlerFetch<
        Record<TBinding, DurableObjectNamespace>
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
                }
            );
        }
    };

    const roomHandler: PluvHandlerFetch<
        Record<TBinding, DurableObjectNamespace>
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
        Record<TBinding, DurableObjectNamespace>
    > = async (request, env) => {
        return [authHandler, roomHandler].reduce((promise, current) => {
            return promise.then((value) => value ?? current(request, env));
        }, Promise.resolve<Response | null>(null));
    };

    const handler: ExportedHandler<Record<TBinding, DurableObjectNamespace>> = {
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
