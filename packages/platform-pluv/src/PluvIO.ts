import type { GetInitialStorageFn, JWTEncodeParams, PluvIOListeners } from "@pluv/io";
import type { BaseUser, InputZodLike } from "@pluv/types";
import { Hono } from "hono";
import { handle } from "hono/vercel";
import type { PluvPlatform } from "./PluvPlatform";
import { ZodEvent } from "./schemas";

interface PluvAuthorize<TUser extends BaseUser> {
    required: true;
    secret: string;
    user: InputZodLike<TUser>;
}

export type PluvIOConfig<TUser extends BaseUser> = Partial<
    Pick<PluvIOListeners<PluvPlatform, PluvAuthorize<TUser>, {}, {}>, "onRoomDeleted">
> & {
    authorize: {
        user: InputZodLike<TUser>;
    };
    basePath: string;
    getInitialStorage?: GetInitialStorageFn<PluvPlatform>;
    publicKey: string;
    secretKey: string;
};

export class PluvIO<TUser extends BaseUser> {
    private readonly _authorize: PluvAuthorize<TUser>;
    private readonly _basePath: string;
    private readonly _getInitialStorage?: GetInitialStorageFn<PluvPlatform>;
    private readonly _listeners: Pick<PluvIOListeners<PluvPlatform, PluvAuthorize<TUser>, {}, {}>, "onRoomDeleted">;
    private readonly _publicKey: string;
    private readonly _secretKey: string;

    public get fetch() {
        const app = new Hono().basePath(this._basePath).route("/", this._webhooks);

        return app.fetch;
    }

    public get handler() {
        const app = new Hono().basePath(this._basePath).route("/", this._webhooks);

        return handle(app);
    }

    private _webhooks = new Hono().basePath("/").post("/event", async (c) => {
        const body = await c.req.json();
        const parsed = ZodEvent.safeParse(body);

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

                await Promise.resolve(this._listeners.onRoomDeleted({ context: {}, encodedState, room }));

                return c.json({ data: { room } }, 200);
            }
            default:
                return c.json({ data: { ok: true } }, 200);
        }
    });

    constructor(options: PluvIOConfig<TUser>) {
        const { authorize, basePath, onRoomDeleted, getInitialStorage, publicKey, secretKey } = options;

        this._authorize = {
            required: true,
            secret: "",
            user: authorize.user,
        };
        this._basePath = basePath;
        this._getInitialStorage = getInitialStorage;
        this._listeners = { onRoomDeleted: (event) => onRoomDeleted?.(event) };
        this._publicKey = publicKey;
        this._secretKey = secretKey;
    }

    public async createToken(params: JWTEncodeParams<TUser, PluvPlatform>): Promise<string> {
        const parsed = this._authorize.user.parse(params.user);

        const res = await fetch("https://pluv.io/api/participant/authorize", {
            method: "post",
            body: JSON.stringify({
                maxAge: params.maxAge ?? null,
                room: params.room,
                publicKey: this._publicKey,
                secretKey: this._secretKey,
                user: parsed,
            }),
        }).catch(() => null);

        if (!res || !res.ok || res.status !== 200) {
            throw new Error("Authorization failed");
        }

        const token = await res.text().catch(() => null);

        if (typeof token !== "string") {
            throw new Error("Authorization failed");
        }

        return token;
    }
}
