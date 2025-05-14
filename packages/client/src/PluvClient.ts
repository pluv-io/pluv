import type {
    AbstractCrdtDocFactory,
    CrdtType,
    InferStorage,
    NoopCrdtDocFactory,
} from "@pluv/crdt";
import type { InputZodLike, IOLike, JsonObject } from "@pluv/types";
import { MAX_PRESENCE_SIZE_BYTES } from "./constants";
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
import type { PluvClientLimits, PublicKey, WithMetadata } from "./types";

export type PluvClientOptions<
    TIO extends IOLike<any, any>,
    TPresence extends JsonObject,
    TCrdt extends AbstractCrdtDocFactory<any, any>,
    TMetadata extends JsonObject,
> = RoomEndpoints<TIO, TMetadata> & {
    debug?: boolean;
    initialStorage?: TCrdt;
    /**
     * @description Configurable limits defined for client-side validation. You should only set
     * this if you control the server and have changed the limits there.
     */
    limits?: PluvClientLimits;
    metadata?: InputZodLike<TMetadata>;
    presence?: InputZodLike<TPresence>;
    publicKey?: PublicKey<TMetadata>;
    types: InferCallback<TIO>;
};

export type CreateRoomOptions<
    TIO extends IOLike<any, any>,
    TPresence extends JsonObject,
    TCrdt extends AbstractCrdtDocFactory<any, any>,
    TMetadata extends JsonObject,
    TEvents extends PluvRouterEventConfig<TIO, TPresence, InferStorage<TCrdt>> = {},
> = {
    addons?: readonly PluvRoomAddon<TIO, TMetadata, TPresence, InferStorage<TCrdt>>[];
    debug?: boolean | PluvRoomDebug<TIO>;
    initialPresence?: TPresence;
    initialStorage?: TCrdt;
    onAuthorizationFail?: (error: Error) => void;
    reconnectTimeoutMs?: ReconnectTimeoutMs;
    router?: PluvRouter<TIO, TPresence, InferStorage<TCrdt>, TEvents>;
};

export type EnterRoomParams<TMetadata extends JsonObject = {}> = keyof TMetadata extends never
    ? []
    : [WithMetadata<TMetadata>];

export class PluvClient<
    TIO extends IOLike<any, any>,
    TPresence extends JsonObject = {},
    TCrdt extends AbstractCrdtDocFactory<any, any> = NoopCrdtDocFactory,
    TMetadata extends JsonObject = {},
> {
    public readonly metadata?: InputZodLike<TMetadata>;

    private readonly _authEndpoint: AuthEndpoint<TMetadata> | undefined;
    private readonly _debug: boolean;
    private readonly _initialStorage?: TCrdt;
    private readonly _limits: PluvClientLimits;
    private readonly _presence?: InputZodLike<TPresence>;
    private readonly _publicKey: PublicKey<TMetadata> | null = null;
    private readonly _rooms = new Map<string, PluvRoom<TIO, TMetadata, TPresence, TCrdt, any>>();
    private readonly _wsEndpoint: WsEndpoint<TMetadata> | undefined;

    public get _defs() {
        return {
            initialStorage: this._initialStorage,
        };
    }

    public get procedure(): PluvProcedure<TIO, {}, {}, TPresence, TCrdt, ""> {
        return new PluvProcedure<TIO, {}, {}, TPresence, TCrdt, "">();
    }

    constructor(options: PluvClientOptions<TIO, TPresence, TCrdt, TMetadata>) {
        const {
            authEndpoint,
            debug = false,
            initialStorage,
            limits,
            metadata,
            presence,
            publicKey,
            wsEndpoint,
        } = options;

        this.metadata = metadata;

        this._authEndpoint = authEndpoint as AuthEndpoint<TMetadata>;
        this._debug = debug;
        this._initialStorage = initialStorage;
        this._limits = {
            presenceMaxSize: MAX_PRESENCE_SIZE_BYTES,
            ...limits,
        };
        this._presence = presence;
        this._wsEndpoint = wsEndpoint;

        if (!!publicKey) this._publicKey = publicKey;
    }

    public createRoom = <
        TEvents extends PluvRouterEventConfig<TIO, TPresence, InferStorage<TCrdt>> = {},
    >(
        room: string,
        options: CreateRoomOptions<TIO, TPresence, TCrdt, TMetadata, TEvents> = {},
    ): PluvRoom<TIO, TMetadata, TPresence, TCrdt, TEvents> => {
        const oldRoom = this.getRoom(room);

        if (oldRoom) return oldRoom;

        const newRoom = new PluvRoom<TIO, TMetadata, TPresence, TCrdt, TEvents>(room, {
            addons: options.addons,
            authEndpoint: this._authEndpoint,
            debug: options.debug,
            initialPresence: options.initialPresence,
            initialStorage: options.initialStorage ?? this._initialStorage,
            limits: this._limits,
            metadata: this.metadata,
            onAuthorizationFail: options.onAuthorizationFail,
            presence: this._presence,
            publicKey: this._publicKey ?? undefined,
            reconnectTimeoutMs: options.reconnectTimeoutMs,
            router: options.router,
            wsEndpoint: this._wsEndpoint,
        } as RoomConfig<TIO, TMetadata, TPresence, TCrdt, TEvents>);

        this._rooms.set(room, newRoom);

        this._logDebug(`New room was created: ${room}`);

        return newRoom;
    };

    public enter = async (
        room: string | PluvRoom<TIO, TMetadata, any, any, any>,
        ...args: EnterRoomParams<TMetadata>
    ): Promise<PluvRoom<TIO, TMetadata, TPresence, TCrdt, any>> => {
        const toEnter = typeof room === "string" ? this.getRoom(room) : room;

        if (!toEnter) throw new Error(`Could not find room: ${room}.`);

        this._rooms.set(toEnter.id, toEnter);
        await toEnter.connect(...args);

        this._logDebug(`Entered room: ${room}`);

        return toEnter;
    };

    public getRoom = (room: string): PluvRoom<TIO, TMetadata, TPresence, TCrdt, any> | null => {
        const found = this._rooms.get(room) as
            | PluvRoom<TIO, TMetadata, TPresence, TCrdt, any>
            | undefined;

        return found ?? null;
    };

    public getRooms = (): readonly PluvRoom<TIO, TMetadata, TPresence, TCrdt, any>[] => {
        return Array.from(this._rooms.values());
    };

    public leave = async (room: string | PluvRoom<TIO, any, any, any>): Promise<void> => {
        const toLeave = typeof room === "string" ? this.getRoom(room) : room;

        if (!toLeave) return;

        await toLeave.disconnect();

        this._rooms.delete(toLeave.id);

        this._logDebug(`Left and deleted room: ${room}`);
    };

    public router<TEvents extends PluvRouterEventConfig<TIO, TPresence, InferStorage<TCrdt>> = {}>(
        events: TEvents,
    ): PluvRouter<TIO, TPresence, InferStorage<TCrdt>, TEvents> {
        const invalidName = Object.keys(events).find((name) => name.includes("$"));

        if (typeof invalidName === "string") {
            throw new Error(`Invalid event name. Event names must not contain $: "${invalidName}"`);
        }

        return new PluvRouter<TIO, TPresence, InferStorage<TCrdt>, TEvents>(events);
    }

    private _logDebug(...data: any[]): void {
        if (typeof process === "undefined") return;
        if (process.env?.NODE_ENV === "production") return;

        if (this._debug) console.log(...data);
    }
}
