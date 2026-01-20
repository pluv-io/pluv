import type {
    AbstractPlatformConfig,
    AbstractWebSocket,
    BaseUser,
    ConvertWebSocketConfig,
    GetInitialStorageFn,
    JWTEncodeParams,
    PluvContext,
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
        debug?: boolean;
        endpoints?: PluvIOEndpoints | (() => MaybePromise<PluvIOEndpoints>);
    };
    basePath: string;
    context?: PluvContext<any, TContext>;
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
            onRoomDestroyed: true;
            onRoomMessage: false;
            onStorageDestroyed: true;
            onStorageUpdated: false;
            onUserConnected: true;
            onUserDisconnected: true;
        };
        router: false;
    }
> {
    public readonly id = Math.random().toString();
    public readonly _config = {
        authorize: {
            secret: false as const,
        },
        handleMode: "fetch" as const,
        registrationMode: "attached" as const,
        requireAuth: true as const,
        listeners: {
            onRoomDestroyed: true as const,
            onRoomMessage: false as const,
            onStorageDestroyed: true as const,
            onStorageUpdated: false as const,
            onUserConnected: true as const,
            onUserDisconnected: true as const,
        },
        router: false as const,
    };
    public readonly _name = "platformPluv";

    private readonly _app: Hono;
    private readonly _basePath: string;
    private readonly _context: PluvContext<this, TContext>;
    private readonly _debug: boolean;
    private readonly _endpoints: PluvIOEndpoints | (() => MaybePromise<PluvIOEndpoints>);
    private _getInitialStorage?: GetInitialStorageFn<{}>;
    private _listeners?: PluvIOListeners;
    private readonly _publicKey: PublicKey;
    private readonly _secretKey: SecretKey;
    private readonly _webhookSecret?: WebhookSecret;

    public _createToken = async (params: JWTEncodeParams<any, any>): Promise<string> => {
        const parsed = params.authorize.user.parse(params.user);

        const [endpoints, publicKey, secretKey] = await Promise.all([
            typeof this._endpoints === "object" ? this._endpoints : this._endpoints(),
            typeof this._publicKey === "string" ? this._publicKey : this._publicKey(),
            typeof this._secretKey === "string" ? this._secretKey : this._secretKey(),
        ]);

        this._logDebug({ endpoints, publicKey, secretKey });

        const res = await fetch(endpoints.createToken, {
            headers: { "content-type": "application/json" },
            method: "post",
            body: JSON.stringify({
                maxAge: params.maxAge ?? null,
                publicKey,
                room: params.room,
                secretKey,
                user: parsed,
            }),
        }).catch((error) => {
            this._logDebug(error);

            return null;
        });

        this._logDebug({ response: { status: res?.status ?? null } });

        if (!res || !res.ok || res.status !== 200) {
            throw new Error("Authorization failed");
        }

        const token = await res.text().catch(() => null);

        this._logDebug({ token });

        if (typeof token !== "string") throw new Error("Authorization failed");

        return token;
    };

    constructor(params: PluvPlatformConfig) {
        super();

        const { _defs, basePath, context, publicKey, secretKey, webhookSecret } = params;

        this._basePath = basePath;
        this._context = (context ?? {}) as TContext;
        this._debug = _defs?.debug ?? false;
        this._endpoints = _defs?.endpoints ?? {
            createToken: "https://rooms.pluv.io/api/room/token",
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

    public setSerializedState(
        webSocket: AbstractWebSocket,
        state: WebSocketSerializedState,
    ): WebSocketSerializedState {
        throw new Error("Not implemented");
    }

    public validateConfig(config: any): void {
        this._logDebug("validating config with properties:", Object.keys(config ?? {}));

        if (!config.authorize) {
            this._logDebug("Config `authorize` must be provided to `platformPluv`");
            throw new Error("Config `authorize` must be provided to `platformPluv`");
        }
        if (!!config.onRoomMessage) {
            this._logDebug("Config `onRoomMessage` is not supported on `platformPluv`");
            throw new Error("Config `onRoomMessage` is not supported on `platformPluv`");
        }
        if (!!config.onStorageUpdated) {
            this._logDebug("Config `onStorageUpdated` is not supported on `platformPluv`");
            throw new Error("Config `onStorageUpdated` is not supported on `platformPluv`");
        }

        this._getInitialStorage = config.getInitialStorage;
        this._listeners = {
            onRoomDestroyed: (event) => config.onRoomDestroyed?.(event),
            onStorageDestroyed: (event) => config.onStorageDestroyed?.(event),
            onUserConnected: (event) => config.onUserConnected?.(event),
            onUserDisconnected: (event) => config.onUserDisconnected?.(event),
        };
    }

    private _webhooksRouter = new Hono()
        .basePath("/")
        .post("/", async (c: Context<BlankEnv, "/", BlankInput>) => {
            const [algorithm, signature] = c.req.header(SIGNATURE_HEADER)?.split("=") ?? [];

            try {
                if (!this._webhookSecret) {
                    this._logDebug("Missing webhook secret");
                    throw new HttpError("Unauthorized", 401);
                }
                if (algorithm !== SIGNATURE_ALGORITHM) {
                    this._logDebug(
                        `Verification algorithm is not ${SIGNATURE_ALGORITHM}. Found: `,
                        algorithm,
                    );
                    throw new HttpError("Unauthorized", 401);
                }
                if (!signature) {
                    this._logDebug("Missing webhook signature");
                    throw new HttpError("Unauthorized", 401);
                }

                const [payload, webhookSecret] = await Promise.all([
                    c.req.json(),
                    typeof this._webhookSecret === "string"
                        ? this._webhookSecret
                        : await this._webhookSecret(),
                ]).catch((error) => {
                    this._logDebug(
                        "Could not derive webhook secret: ",
                        error instanceof Error ? error.message : "Unexpected error",
                    );
                    throw error;
                });

                const verified = await verifyWebhook({
                    payload: stringify(payload),
                    signature,
                    secret: webhookSecret,
                }).catch((error) => {
                    this._logDebug(
                        "Error while verifying webhook: ",
                        error instanceof Error ? error.message : "Unexpected error",
                    );

                    return false;
                });

                if (!verified) {
                    this._logDebug("Failed to verify webhook");
                    throw new HttpError("Unauthorized", 401);
                }

                const parsed = ZodEvent.safeParse(payload);

                if (!parsed.success) {
                    this._logDebug(
                        "Failed to validate event payload:",
                        JSON.stringify(parsed.data ?? {}, null, 4),
                    );
                    throw new HttpError("Invalid request", 400);
                }

                const { event, data } = parsed.data;
                const context = await this._getContext();

                switch (event) {
                    case "initial-storage": {
                        const room = data.room;
                        const storage =
                            typeof room === "string"
                                ? ((await this._getInitialStorage?.({ context, room })) ?? null)
                                : null;

                        try {
                            return createSuccessResponse(c, { event, room, storage });
                        } catch (error) {
                            this._logDebug("Could not create getInitialStorage response");
                            throw error;
                        }
                    }
                    case "room-destroyed": {
                        const room = data.room;

                        await Promise.resolve(
                            this._listeners?.onRoomDestroyed({
                                context,
                                platform: this,
                                room,
                            }),
                        );

                        try {
                            return createSuccessResponse(c, { event, room });
                        } catch (error) {
                            this._logDebug("Could not create onRoomDestroyed response");
                            throw error;
                        }
                    }
                    case "storage-destroyed": {
                        const room = data.room;
                        const encodedState = data.storage;

                        await Promise.resolve(
                            this._listeners?.onStorageDestroyed({
                                context,
                                encodedState,
                                platform: this,
                                room,
                            }),
                        );

                        try {
                            return createSuccessResponse(c, { event, room });
                        } catch (error) {
                            this._logDebug("Could not create onStorageDestroyed response");
                            throw error;
                        }
                    }
                    case "user-connected": {
                        const room = data.room;
                        const encodedState = data.storage;
                        const user = data.user as any;

                        await Promise.resolve(
                            this._listeners?.onUserConnected({
                                context,
                                encodedState,
                                platform: this,
                                room,
                                user,
                            }),
                        );

                        try {
                            return createSuccessResponse(c, { event, room });
                        } catch (error) {
                            this._logDebug("Could not create onUserConnected response");
                            throw error;
                        }
                    }
                    case "user-disconnected": {
                        const room = data.room;
                        const encodedState = data.storage;
                        const user = data.user as any;

                        await Promise.resolve(
                            this._listeners?.onUserDisconnected({
                                context,
                                encodedState,
                                platform: this,
                                room,
                                user,
                            }),
                        );

                        try {
                            return createSuccessResponse(c, { event, room });
                        } catch (error) {
                            this._logDebug("Could not create onUserDisconnected response");
                            throw error;
                        }
                    }
                    default: {
                        throw new HttpError("Unknown event", 400);
                    }
                }
            } catch (error) {
                const message = error instanceof Error ? error.message : "Unexpected error";
                const status = error instanceof HttpError ? error.status : 500;

                this._logDebug("Uncaught error: ", message);

                return createErrorResponse(c, { message }, status);
            }
        });

    private async _getContext(): Promise<TContext> {
        return typeof this._context === "function"
            ? await Promise.resolve(this._context(this._roomContext as any))
            : await Promise.resolve(this._context);
    }

    private _logDebug(...args: any[]): void {
        if (!this._debug) return;

        console.log("[PLATFORM PLUV]", ...args);
    }
}
