import type {
    AbstractPlatformConfig,
    AbstractWebSocket,
    BaseUser,
    ConvertWebSocketConfig,
    GetInitialStorageFn,
    JWTEncodeParams,
    WebSocketSerializedState,
} from "@pluv/io";
import { AbstractPlatform } from "@pluv/io";
import type { MaybePromise } from "@pluv/types";
import stringify from "fast-json-stable-stringify";
import type { Context } from "hono";
import { Hono } from "hono";
import type { BlankEnv, BlankInput } from "hono/types";
import { SIGNATURE_ALGORITHM, SIGNATURE_HEADER } from "./constants";
import { ZodEvent } from "./schemas";
import { createErrorResponse, createSuccessResponse, HttpError, verifyWebhook } from "./shared";
import type { PluvIOEndpoints, PluvIOListeners } from "./types";

export type PublicKey = string | (() => MaybePromise<string>);
export type SecretKey = string | (() => MaybePromise<string>);
export type WebhookSecret = string | (() => MaybePromise<string>);

export interface PluvPlatformConfig<TContext extends Record<string, any> = {}> {
    /**
     * @ignore
     * @readonly
     * @deprecated Internal use only. Changes to this will never be marked as breaking.
     */
    _defs?: {
        endpoints?: PluvIOEndpoints;
    };
    basePath: string;
    context?: TContext;
    publicKey: PublicKey;
    secretKey: SecretKey;
    webhookSecret?: WebhookSecret;
}

export class PluvPlatform<
    TContext extends Record<string, any> = {},
    TUser extends BaseUser = BaseUser,
> extends AbstractPlatform<
    any,
    {},
    {},
    {
        authorize: {
            secret: false;
        };
        handleMode: "fetch";
        registrationMode: "attached";
        requireAuth: true;
        listeners: {
            onRoomDeleted: true;
            onRoomMessage: false;
            onStorageUpdated: false;
            onUserConnected: true;
            onUserDisconnected: true;
        };
        router: false;
    }
> {
    public readonly _config = {
        authorize: {
            secret: false as const,
        },
        handleMode: "fetch" as const,
        registrationMode: "attached" as const,
        requireAuth: true as const,
        listeners: {
            onRoomDeleted: true as const,
            onRoomMessage: false as const,
            onStorageUpdated: false as const,
            onUserConnected: true as const,
            onUserDisconnected: true as const,
        },
        router: false as const,
    };
    public readonly _name = "platformPluv";

    private readonly _app: Hono;
    private _authorize: any;
    private readonly _basePath: string;
    private readonly _context: any;
    private readonly _endpoints: PluvIOEndpoints;
    private _getInitialStorage?: GetInitialStorageFn<{}>;
    private _listeners?: PluvIOListeners;
    private readonly _publicKey: PublicKey;
    private readonly _secretKey: SecretKey;
    private readonly _webhookSecret?: WebhookSecret;

    public _createToken = async (params: JWTEncodeParams<any, any>): Promise<string> => {
        const parsed = this._authorize.user.parse(params.user);

        const [publicKey, secretKey] = await Promise.all([
            typeof this._publicKey === "string" ? this._publicKey : this._publicKey(),
            typeof this._secretKey === "string" ? this._secretKey : this._secretKey(),
        ]);

        const res = await fetch(this._endpoints.createToken, {
            headers: { "content-type": "application/json" },
            method: "post",
            body: JSON.stringify({
                maxAge: params.maxAge ?? null,
                publicKey,
                room: params.room,
                secretKey,
                user: parsed,
            }),
        }).catch(() => null);

        if (!res || !res.ok || res.status !== 200) {
            throw new Error("Authorization failed");
        }

        const token = await res.text().catch(() => null);

        if (typeof token !== "string") throw new Error("Authorization failed");

        return token;
    };

    constructor(params: PluvPlatformConfig) {
        super();

        const { _defs, context, basePath, publicKey, secretKey, webhookSecret } = params;

        this._basePath = basePath;
        this._context = typeof context === "function" ? context(this._roomContext) : context;
        this._endpoints = {
            createToken: "https://pluv.io/api/room/token",
            ..._defs?.endpoints,
        };
        this._publicKey = publicKey;
        this._secretKey = secretKey;
        this._webhookSecret = webhookSecret;

        this._app = new Hono().basePath(this._basePath).route("/", this._webhooksRouter);
        this._fetch = this._app.fetch as (req: any) => Promise<any>;
    }

    public acceptWebSocket(webSocket: AbstractWebSocket): Promise<void> {
        throw new Error("Not implemented");
    }

    public convertWebSocket(webSocket: any, config: ConvertWebSocketConfig): AbstractWebSocket {
        throw new Error("Not implemented");
    }

    public getLastPing(webSocket: AbstractWebSocket): number | null {
        throw new Error("Not implemented");
    }

    public getSerializedState(webSocket: any): WebSocketSerializedState | null {
        throw new Error("Not implemented");
    }

    public getSessionId(webSocket: any): string | null {
        throw new Error("Not implemented");
    }

    public getWebSockets(): readonly any[] {
        throw new Error("Not implemented");
    }

    public initialize(config: AbstractPlatformConfig<{}>): this {
        throw new Error("Not implemented");
    }

    public parseData(data: string | ArrayBuffer): Record<string, any> {
        throw new Error("Not implemented");
    }

    public randomUUID(): string {
        throw new Error("Not implemented");
    }

    public setSerializedState(webSocket: AbstractWebSocket, state: WebSocketSerializedState): WebSocketSerializedState {
        throw new Error("Not implemented");
    }

    public validateConfig(config: any): void {
        if (!config.authorize) throw new Error("Config `authorize` must be provided to `platformPluv`");
        if (!!config.onRoomMessage) throw new Error("Config `onRoomMessage` is not supported on `platformPluv`");
        if (!!config.onStorageUpdated) throw new Error("Config `onStorageUpdated` is not supported on `platformPluv`");

        /**
         * !HACK
         * @description Assign these on the validation step, because we know this will happen on the
         * server constructor internally.
         * @date December 16, 2024
         */
        this._authorize = config.authorize;
        this._getInitialStorage = config.getInitialStorage;
        this._listeners = {
            onRoomDeleted: (event) => config.onRoomDeleted?.(event),
            onUserConnected: (event) => config.onUserConnected?.(event),
            onUserDisconnected: (event) => config.onUserDisconnected?.(event),
        };
    }

    private _webhooksRouter = new Hono().basePath("/").post("/", async (c: Context<BlankEnv, "/", BlankInput>) => {
        const [algorithm, signature] = c.req.header(SIGNATURE_HEADER)?.split("=") ?? [];

        try {
            if (!this._webhookSecret) throw new HttpError("Unauthorized", 401);
            if (algorithm !== SIGNATURE_ALGORITHM) throw new HttpError("Unauthorized", 401);
            if (!signature) throw new HttpError("Unauthorized", 401);

            const [payload, webhookSecret] = await Promise.all([
                c.req.json(),
                typeof this._webhookSecret === "string" ? this._webhookSecret : await this._webhookSecret(),
            ]);

            const verified = await verifyWebhook({
                payload: stringify(payload),
                signature,
                secret: webhookSecret,
            });

            if (!verified) throw new HttpError("Unauthorized", 401);

            const parsed = ZodEvent.safeParse(payload);

            if (!parsed.success) throw new HttpError("Invalid request", 400);

            const { event, data } = parsed.data;
            const context = this._context;

            switch (event) {
                case "initial-storage": {
                    const room = data.room;
                    const storage =
                        typeof room === "string"
                            ? ((await this._getInitialStorage?.({ context, room })) ?? null)
                            : null;

                    return createSuccessResponse(c, { event, room, storage });
                }
                case "room-deleted": {
                    const room = data.room;
                    const encodedState = data.storage;

                    await Promise.resolve(this._listeners?.onRoomDeleted({ context, encodedState, room }));

                    return createSuccessResponse(c, { event, room });
                }
                case "user-connected": {
                    const room = data.room;
                    const encodedState = data.storage;
                    const user = data.user as any;

                    await Promise.resolve(this._listeners?.onUserConnected({ context, encodedState, room, user }));

                    return createSuccessResponse(c, { event, room });
                }
                case "user-disconnected": {
                    const room = data.room;
                    const encodedState = data.storage;
                    const user = data.user as any;

                    await Promise.resolve(this._listeners?.onUserDisconnected({ context, encodedState, room, user }));

                    return createSuccessResponse(c, { event, room });
                }
                default: {
                    throw new HttpError("Unknown event", 400);
                }
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : "Unexpected error";
            const status = error instanceof HttpError ? error.status : 500;

            return createErrorResponse(c, { message }, status);
        }
    });
}
