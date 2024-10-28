import type { GetInitialStorageFn, JWTEncodeParams } from "@pluv/io";
import type { BaseUser, IOLike, InputZodLike } from "@pluv/types";
import { Hono } from "hono";
import { handle } from "hono/vercel";
import { SIGNATURE_HEADER } from "./constants";
import type { PluvPlatform } from "./PluvPlatform";
import { ZodEvent } from "./schemas";
import { verifyWebhook } from "./shared";

interface PluvAuthorize<TUser extends BaseUser> {
    required: true;
    secret: string;
    user: InputZodLike<TUser>;
}

interface PluvIOEndpoints {
    createToken: string;
}

type RoomDeletedMessageEventData = {
    encodedState: string | null;
    room: string;
};

type UserConnectedEventData<TUser extends BaseUser> = {
    encodedState: string | null;
    room: string;
    user: TUser;
};

type UserDisconnectedEventData<TUser extends BaseUser> = {
    encodedState: string | null;
    room: string;
    user: TUser;
};

type PluvIOListeners<TUser extends BaseUser> = {
    onRoomDeleted: (event: RoomDeletedMessageEventData) => void;
    onUserConnected: (event: UserConnectedEventData<TUser>) => void;
    onUserDisconnected: (event: UserDisconnectedEventData<TUser>) => void;
};

type WebhooksConfig<TUser extends BaseUser> =
    | ({ webhookSecret?: undefined } & { [P in keyof PluvIOListeners<TUser>]?: undefined })
    | ({ webhookSecret: string } & Partial<PluvIOListeners<TUser>>);

export type PluvIOConfig<TUser extends BaseUser> = WebhooksConfig<TUser> & {
    /**
     * @ignore
     * @readonly
     * @deprecated Internal use only. Changes to this will never be marked as breaking.
     */
    _defs?: {
        endpoints?: PluvIOEndpoints;
    };
    authorize: {
        user: InputZodLike<TUser>;
    };
    basePath: string;
    getInitialStorage?: GetInitialStorageFn;
    publicKey: string;
    secretKey: string;
};

export class PluvIO<TUser extends BaseUser> implements IOLike<PluvAuthorize<TUser>, {}> {
    private readonly _authorize: PluvAuthorize<TUser>;
    private readonly _basePath: string;
    private readonly _endpoints: PluvIOEndpoints;
    private readonly _getInitialStorage?: GetInitialStorageFn;
    private readonly _listeners: PluvIOListeners<TUser>;
    private readonly _publicKey: string;
    private readonly _secretKey: string;
    private readonly _webhookSecret?: string;

    /**
     * @ignore
     * @readonly
     * @deprecated Internal use only. Changes to this will never be marked as breaking.
     */
    public get _defs() {
        return {
            authorize: this._authorize,
            context: {},
            events: {},
            get platform() {
                throw new Error("Invalid platform reference");
            },
        };
    }

    public get fetch() {
        const app = new Hono().basePath(this._basePath).route("/", this._webhooks);

        return app.fetch;
    }

    public get handler() {
        const app = new Hono().basePath(this._basePath).route("/", this._webhooks);

        return handle(app);
    }

    private _webhooks = new Hono().basePath("/").post("/event", async (c) => {
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
                const storage = typeof room === "string" ? ((await this._getInitialStorage?.({ room })) ?? null) : null;

                return c.json({ data: { storage } }, 200);
            }
            case "room-deleted": {
                const room = data.room;
                const encodedState = data.storage;

                await Promise.resolve(this._listeners.onRoomDeleted({ encodedState, room }));

                return c.json({ data: { room } }, 200);
            }
            case "user-connected": {
                const room = data.room;
                const encodedState = data.storage;
                const user = data.user as TUser;

                await Promise.resolve(this._listeners.onUserConnected({ encodedState, room, user }));
            }
            case "user-disconnected": {
                const room = data.room;
                const encodedState = data.storage;
                const user = data.user as TUser;

                await Promise.resolve(this._listeners.onUserDisconnected({ encodedState, room, user }));
            }
            default:
                return c.json({ data: { ok: true } }, 200);
        }
    });

    constructor(options: PluvIOConfig<TUser>) {
        const {
            _defs,
            authorize,
            basePath,
            getInitialStorage,
            onRoomDeleted,
            onUserConnected,
            onUserDisconnected,
            publicKey,
            secretKey,
            webhookSecret,
        } = options;

        this._authorize = {
            required: true,
            secret: "",
            user: authorize.user,
        };
        this._basePath = basePath;
        this._endpoints = {
            createToken: "https://pluv.io/api/room/token",
            ..._defs?.endpoints,
        };
        this._getInitialStorage = getInitialStorage;
        this._listeners = {
            onRoomDeleted: (event) => onRoomDeleted?.(event),
            onUserConnected: (event) => onUserConnected?.(event),
            onUserDisconnected: (event) => onUserDisconnected?.(event),
        };
        this._publicKey = publicKey;
        this._secretKey = secretKey;
        this._webhookSecret = webhookSecret;
    }

    public async createToken(params: JWTEncodeParams<TUser, PluvPlatform>): Promise<string> {
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
    }
}
