import type {
    AbstractPlatformConfig,
    AbstractWebSocket,
    ConvertWebSocketConfig,
    GetInitialStorageFn,
    JWTEncodeParams,
    WebSocketSerializedState,
} from "@pluv/io";
import { AbstractPlatform } from "@pluv/io";
import { Hono } from "hono";
import { SIGNATURE_HEADER } from "./constants";
import { ZodEvent } from "./schemas";
import { verifyWebhook } from "./shared";
import type { PluvIOEndpoints, PluvIOListeners } from "./types";

export interface PluvPlatformConfig {
    /**
     * @ignore
     * @readonly
     * @deprecated Internal use only. Changes to this will never be marked as breaking.
     */
    _defs?: {
        endpoints?: PluvIOEndpoints;
    };
    basePath: string;
    publicKey: string;
    secretKey: string;
    webhookSecret?: string;
}

export class PluvPlatform extends AbstractPlatform<
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
    };
    public readonly _name = "platformPluv";

    private _authorize: any;
    private readonly _basePath: string;
    private readonly _endpoints: PluvIOEndpoints;
    private _getInitialStorage?: GetInitialStorageFn<{}>;
    private _listeners?: PluvIOListeners;
    private readonly _publicKey: string;
    private readonly _secretKey: string;
    private readonly _webhookSecret?: string;

    public _createToken = async (params: JWTEncodeParams<any, any>): Promise<string> => {
        const parsed = this._authorize.user.parse(params.user);

        const res = await fetch(this._endpoints.createToken, {
            headers: { "content-type": "application/json" },
            method: "post",
            body: JSON.stringify({
                maxAge: params.maxAge ?? null,
                publicKey: this._publicKey,
                room: params.room,
                secretKey: this._secretKey,
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

        const { _defs, basePath, publicKey, secretKey, webhookSecret } = params;

        this._basePath = basePath;
        this._endpoints = {
            createToken: "https://pluv.io/api/room/token",
            ..._defs?.endpoints,
        };
        this._publicKey = publicKey;
        this._secretKey = secretKey;
        this._webhookSecret = webhookSecret;

        this._fetch = new Hono().basePath(this._basePath).route("/", this._webhooks).fetch as (
            req: any,
        ) => Promise<any>;
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

    public setSerializedState(webSocket: AbstractWebSocket, state: WebSocketSerializedState): void {
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
            onRoomDeleted: config.onRoomDeleted,
            onUserConnected: config.onUserConnected,
            onUserDisconnected: config.onUserDisconnected,
        };
    }

    private _webhooks = new Hono().basePath("/").post("/", async (c) => {
        const signature = c.req.header(SIGNATURE_HEADER);

        if (!this._webhookSecret || !signature) return c.json({ error: "Unauthorized" }, 401);

        const payload = await c.req.json();

        const verified = await verifyWebhook({
            payload,
            signature,
            secret: this._webhookSecret,
        });

        if (!verified) return c.json({ error: "Unauthorized" }, 401);

        const parsed = ZodEvent.safeParse(payload);

        if (!parsed.success) return c.json({ data: { ok: true } }, 200);

        const { event, data } = parsed.data;

        switch (event) {
            case "initial-storage": {
                const room = data.room;
                const storage =
                    typeof room === "string"
                        ? ((await this._getInitialStorage?.({ context: {}, room })) ?? null)
                        : null;

                return c.json({ data: { storage } }, 200);
            }
            case "room-deleted": {
                const room = data.room;
                const encodedState = data.storage;

                await Promise.resolve(this._listeners?.onRoomDeleted({ encodedState, room }));

                return c.json({ data: { room } }, 200);
            }
            case "user-connected": {
                const room = data.room;
                const encodedState = data.storage;
                const user = data.user as any;

                await Promise.resolve(this._listeners?.onUserConnected({ encodedState, room, user }));
            }
            case "user-disconnected": {
                const room = data.room;
                const encodedState = data.storage;
                const user = data.user as any;

                await Promise.resolve(this._listeners?.onUserDisconnected({ encodedState, room, user }));
            }
            default:
                return c.json({ data: { ok: true } }, 200);
        }
    });
}
