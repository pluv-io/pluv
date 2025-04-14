import type { AbstractCrdtDocFactory, CrdtType } from "@pluv/crdt";
import type { InputZodLike, IOLike, JsonObject } from "@pluv/types";
import type { InferCallback } from "./infer";
import { PluvProcedure } from "./PluvProcedure";
import type {
    AuthEndpoint,
    PluvRoomAddon,
    PluvRoomDebug,
    ReconnectTimeoutMs,
    RoomConfig,
    RoomEndpoints,
    WsEndpoint,
} from "./PluvRoom";
import { PluvRoom } from "./PluvRoom";
import type { PluvRouterEventConfig } from "./PluvRouter";
import { PluvRouter } from "./PluvRouter";
import type { PublicKey, WithMetadata } from "./types";

export type PluvClientOptions<
    TIO extends IOLike<any, any>,
    TPresence extends JsonObject,
    TStorage extends Record<string, CrdtType<any, any>>,
    TMetadata extends JsonObject,
> = RoomEndpoints<TIO, TMetadata> & {
    debug?: boolean;
    initialStorage?: AbstractCrdtDocFactory<TStorage>;
    metadata?: InputZodLike<TMetadata>;
    presence?: InputZodLike<TPresence>;
    publicKey?: PublicKey<TMetadata>;
    types: InferCallback<TIO>;
};

export type CreateRoomOptions<
    TIO extends IOLike<any, any>,
    TPresence extends JsonObject,
    TStorage extends Record<string, CrdtType<any, any>>,
    TMetadata extends JsonObject,
    TEvents extends PluvRouterEventConfig<TIO, TPresence, TStorage> = {},
> = {
    addons?: readonly PluvRoomAddon<TIO, TMetadata, TPresence, TStorage>[];
    debug?: boolean | PluvRoomDebug<TIO>;
    initialPresence?: TPresence;
    initialStorage?: AbstractCrdtDocFactory<TStorage>;
    onAuthorizationFail?: (error: Error) => void;
    reconnectTimeoutMs?: ReconnectTimeoutMs;
    router?: PluvRouter<TIO, TPresence, TStorage, TEvents>;
};

export type EnterRoomParams<TMetadata extends JsonObject = {}> = keyof TMetadata extends never
    ? []
    : [WithMetadata<TMetadata>];

export class PluvClient<
    TIO extends IOLike<any, any>,
    TPresence extends JsonObject = {},
    TStorage extends Record<string, CrdtType<any, any>> = {},
    TMetadata extends JsonObject = {},
> {
    public readonly metadata?: InputZodLike<TMetadata>;

    private readonly _authEndpoint: AuthEndpoint<TMetadata> | undefined;
    private readonly _debug: boolean;
    private readonly _initialStorage?: AbstractCrdtDocFactory<TStorage>;
    private readonly _presence?: InputZodLike<TPresence>;
    private readonly _publicKey: PublicKey<TMetadata> | null = null;
    private readonly _rooms = new Map<string, PluvRoom<TIO, TMetadata, TPresence, TStorage, any>>();
    private readonly _wsEndpoint: WsEndpoint<TMetadata> | undefined;

    public get _defs() {
        return {
            initialStorage: this._initialStorage,
        };
    }

    public get procedure(): PluvProcedure<TIO, {}, {}, TPresence, TStorage> {
        return new PluvProcedure<TIO, {}, {}, TPresence, TStorage>();
    }

    constructor(options: PluvClientOptions<TIO, TPresence, TStorage, TMetadata>) {
        const { authEndpoint, debug = false, initialStorage, metadata, presence, publicKey, wsEndpoint } = options;

        this.metadata = metadata;

        this._authEndpoint = authEndpoint as AuthEndpoint<TMetadata>;
        this._debug = debug;
        this._initialStorage = initialStorage;
        this._presence = presence;
        this._wsEndpoint = wsEndpoint;

        if (!!publicKey) this._publicKey = publicKey;
    }

    public createRoom = <TEvents extends PluvRouterEventConfig<TIO, TPresence, TStorage> = {}>(
        room: string,
        options: CreateRoomOptions<TIO, TPresence, TStorage, TMetadata, TEvents>,
    ): PluvRoom<TIO, TMetadata, TPresence, TStorage, TEvents> => {
        const oldRoom = this.getRoom(room);

        if (oldRoom) return oldRoom;

        const newRoom = new PluvRoom<TIO, TMetadata, TPresence, TStorage, TEvents>(room, {
            addons: options.addons,
            authEndpoint: this._authEndpoint,
            debug: options.debug,
            initialPresence: options.initialPresence,
            initialStorage: this._initialStorage,
            metadata: this.metadata,
            onAuthorizationFail: options.onAuthorizationFail,
            presence: this._presence,
            publicKey: this._publicKey ?? undefined,
            reconnectTimeoutMs: options.reconnectTimeoutMs,
            router: options.router,
            wsEndpoint: this._wsEndpoint,
        } as RoomConfig<TIO, TMetadata, TPresence, TStorage, TEvents>);

        this._rooms.set(room, newRoom);

        this._logDebug(`New room was created: ${room}`);

        return newRoom;
    };

    public enter = async (
        room: string | PluvRoom<TIO, TMetadata, any, any, any>,
        ...args: EnterRoomParams<TMetadata>
    ): Promise<PluvRoom<TIO, TMetadata, TPresence, TStorage, any>> => {
        const toEnter = typeof room === "string" ? this.getRoom(room) : room;

        if (!toEnter) throw new Error(`Could not find room: ${room}.`);

        this._rooms.set(toEnter.id, toEnter);
        await toEnter.connect(...args);

        this._logDebug(`Entered room: ${room}`);

        return toEnter;
    };

    public getRoom = (room: string): PluvRoom<TIO, TMetadata, TPresence, TStorage, any> | null => {
        const found = this._rooms.get(room) as PluvRoom<TIO, TMetadata, TPresence, TStorage, any> | undefined;

        return found ?? null;
    };

    public getRooms = (): readonly PluvRoom<TIO, TMetadata, TPresence, TStorage, any>[] => {
        return Array.from(this._rooms.values());
    };

    public leave = async (room: string | PluvRoom<TIO, any, any, any>): Promise<void> => {
        const toLeave = typeof room === "string" ? this.getRoom(room) : room;

        if (!toLeave) return;

        await toLeave.disconnect();

        this._rooms.delete(toLeave.id);

        this._logDebug(`Left and deleted room: ${room}`);
    };

    public router<TEvents extends PluvRouterEventConfig<TIO, TPresence, TStorage> = {}>(
        events: TEvents,
    ): PluvRouter<TIO, TPresence, TStorage, TEvents> {
        const invalidName = Object.keys(events).find((name) => name.includes("$"));

        if (typeof invalidName === "string") {
            throw new Error(`Invalid event name. Event names must not contain $: "${invalidName}"`);
        }

        return new PluvRouter<TIO, TPresence, TStorage, TEvents>(events);
    }

    private _logDebug(...data: any[]): void {
        // eslint-disable-next-line turbo/no-undeclared-env-vars
        if (process?.env?.NODE_ENV === "production") return;

        this._debug && console.log(...data);
    }
}
