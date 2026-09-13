import type { AbstractCrdtDocFactory, InferSeed, InferStorage } from "@pluv/crdt";
import type {
    HasCrdtLibrary,
    InferIOCrdt,
    InferIOCrdtKind,
    IOLike,
    StandardSchemaV1,
} from "@pluv/types";
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
import type {
    InferSchemaInput,
    InferSchemaOutput,
    PluvClientLimits,
    PublicKey,
    WithMetadata,
} from "./types";

export type PluvClientOptions<
    TIO extends IOLike<any, any, any>,
    TPresenceSchema extends StandardSchemaV1<any, any> | undefined,
    TCrdt extends AbstractCrdtDocFactory<any, any, any, any>,
    TMetadataSchema extends StandardSchemaV1<any, any> | undefined,
> = RoomEndpoints<TIO, InferSchemaOutput<TMetadataSchema>> & {
    debug?: boolean;
    /**
     * @description Configurable limits defined for client-side validation. You should only set
     * this if you control the server and have changed the limits there.
     */
    limits?: PluvClientLimits;
    metadata?: TMetadataSchema;
    presence?: TPresenceSchema;
    publicKey?: PublicKey<InferSchemaOutput<TMetadataSchema>>;
    types: InferCallback<TIO>;
} & (HasCrdtLibrary<InferIOCrdt<TIO>> extends true
        ? { storage?: TCrdt; initialStorage?: InferSeed<TCrdt> }
        : { storage?: "[ERROR]: Must provide crdt to createIO to use storage" });

export type CreateRoomOptions<
    TIO extends IOLike<any, any, any>,
    TPresenceSchema extends StandardSchemaV1<any, any> | undefined,
    TCrdt extends AbstractCrdtDocFactory<any, any, any, any>,
    TMetadataSchema extends StandardSchemaV1<any, any> | undefined,
    TEvents extends PluvRouterEventConfig<
        TIO,
        InferSchemaOutput<TPresenceSchema>,
        InferStorage<TCrdt>
    > = {},
> = {
    addons?: readonly PluvRoomAddon<
        TIO,
        InferSchemaOutput<TMetadataSchema>,
        InferSchemaOutput<TPresenceSchema>,
        TCrdt
    >[];
    debug?: boolean | PluvRoomDebug<TIO>;
    initialPresence?: InferSchemaInput<TPresenceSchema>;
    initialStorage?: InferSeed<TCrdt>;
    onAuthorizationFail?: (error: Error) => void;
    reconnectTimeoutMs?: ReconnectTimeoutMs;
    router?: PluvRouter<TIO, InferSchemaOutput<TPresenceSchema>, InferStorage<TCrdt>, TEvents>;
};

export type EnterRoomParams<TMetadata extends Record<string, any> = {}> =
    keyof TMetadata extends never ? [] : [WithMetadata<TMetadata>];

export class PluvClient<
    TIO extends IOLike<any, any, any>,
    TPresenceSchema extends StandardSchemaV1<any, any> | undefined = undefined,
    TCrdt extends AbstractCrdtDocFactory<any, any, any, any> = InferIOCrdtKind<TIO>,
    TMetadataSchema extends StandardSchemaV1<any, any> | undefined = undefined,
> {
    public readonly metadata?: TMetadataSchema;

    private readonly _authEndpoint: AuthEndpoint<InferSchemaOutput<TMetadataSchema>>;
    private readonly _debug: boolean;
    private readonly _initialStorage?: InferSeed<TCrdt>;
    private readonly _limits: PluvClientLimits;
    private readonly _presence?: TPresenceSchema;
    private readonly _publicKey: PublicKey<InferSchemaOutput<TMetadataSchema>> | null = null;
    private readonly _rooms = new Map<
        string,
        PluvRoom<
            TIO,
            InferSchemaOutput<TMetadataSchema>,
            InferSchemaOutput<TPresenceSchema>,
            TCrdt,
            any
        >
    >();
    private readonly _storage?: TCrdt;
    private readonly _wsEndpoint: WsEndpoint<InferSchemaOutput<TMetadataSchema>> | undefined;

    public get _defs() {
        return {
            initialStorage: this._initialStorage,
            storage: this._storage,
        };
    }

    public get procedure(): PluvProcedure<
        TIO,
        {},
        {},
        InferSchemaOutput<TPresenceSchema>,
        TCrdt,
        ""
    > {
        return new PluvProcedure<TIO, {}, {}, InferSchemaOutput<TPresenceSchema>, TCrdt, "">();
    }

    constructor(options: PluvClientOptions<TIO, TPresenceSchema, TCrdt, TMetadataSchema>) {
        const {
            authEndpoint,
            debug = false,
            initialStorage,
            limits,
            metadata,
            presence,
            publicKey,
            storage,
            wsEndpoint,
        } = options as PluvClientOptions<TIO, TPresenceSchema, TCrdt, TMetadataSchema> & {
            initialStorage?: InferSeed<TCrdt>;
            storage?: TCrdt;
        };

        this.metadata = metadata;

        this._authEndpoint = authEndpoint;
        this._debug = debug;
        this._initialStorage = initialStorage as InferSeed<TCrdt> | undefined;
        this._limits = {
            presenceMaxSize: MAX_PRESENCE_SIZE_BYTES,
            ...limits,
        };
        this._presence = presence;
        this._storage = storage as TCrdt | undefined;
        this._wsEndpoint = wsEndpoint;

        if (!!publicKey) this._publicKey = publicKey;
    }

    public createRoom = <
        TEvents extends PluvRouterEventConfig<
            TIO,
            InferSchemaOutput<TPresenceSchema>,
            InferStorage<TCrdt>
        > = {},
    >(
        room: string,
        options: CreateRoomOptions<TIO, TPresenceSchema, TCrdt, TMetadataSchema, TEvents> = {},
    ): PluvRoom<
        TIO,
        InferSchemaOutput<TMetadataSchema>,
        InferSchemaOutput<TPresenceSchema>,
        TCrdt,
        TEvents
    > => {
        const oldRoom = this.getRoom(room);

        if (oldRoom) return oldRoom;

        const newRoom = new PluvRoom<
            TIO,
            InferSchemaOutput<TMetadataSchema>,
            InferSchemaOutput<TPresenceSchema>,
            TCrdt,
            TEvents
        >(room, {
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
            storage: this._storage,
            wsEndpoint: this._wsEndpoint,
        } as RoomConfig<
            TIO,
            InferSchemaOutput<TMetadataSchema>,
            InferSchemaOutput<TPresenceSchema>,
            TCrdt,
            TEvents
        >);

        this._rooms.set(room, newRoom);

        this._logDebug(`New room was created: ${room}`);

        return newRoom;
    };

    public enter = async (
        room: string | PluvRoom<TIO, InferSchemaOutput<TMetadataSchema>, any, any, any>,
        ...args: EnterRoomParams<InferSchemaInput<TMetadataSchema>>
    ): Promise<
        PluvRoom<
            TIO,
            InferSchemaOutput<TMetadataSchema>,
            InferSchemaOutput<TPresenceSchema>,
            TCrdt,
            any
        >
    > => {
        const toEnter = typeof room === "string" ? this.getRoom(room) : room;
        const roomId = typeof room === "string" ? room : room.id;

        if (!toEnter) throw new Error(`Could not find room: ${roomId}.`);

        this._rooms.set(toEnter.id, toEnter);
        await toEnter.connect(...(args as any));

        this._logDebug(`Entered room: ${roomId}`);

        return toEnter;
    };

    public getRoom = (
        room: string,
    ): PluvRoom<
        TIO,
        InferSchemaOutput<TMetadataSchema>,
        InferSchemaOutput<TPresenceSchema>,
        TCrdt,
        any
    > | null => {
        const found = this._rooms.get(room) as
            | PluvRoom<
                  TIO,
                  InferSchemaOutput<TMetadataSchema>,
                  InferSchemaOutput<TPresenceSchema>,
                  TCrdt,
                  any
              >
            | undefined;

        return found ?? null;
    };

    public getRooms = (): readonly PluvRoom<
        TIO,
        InferSchemaOutput<TMetadataSchema>,
        InferSchemaOutput<TPresenceSchema>,
        TCrdt,
        any
    >[] => {
        return Array.from(this._rooms.values());
    };

    public leave = async (room: string | PluvRoom<TIO, any, any, any>): Promise<void> => {
        const toLeave = typeof room === "string" ? this.getRoom(room) : room;

        if (!toLeave) return;

        await toLeave.disconnect();

        this._rooms.delete(toLeave.id);

        this._logDebug(`Left and deleted room: ${toLeave.id}`);
    };

    public router<
        TEvents extends PluvRouterEventConfig<
            TIO,
            InferSchemaOutput<TPresenceSchema>,
            InferStorage<TCrdt>
        > = {},
    >(
        events: TEvents,
    ): PluvRouter<TIO, InferSchemaOutput<TPresenceSchema>, InferStorage<TCrdt>, TEvents> {
        const invalidName = Object.keys(events).find((name) => name.includes("$"));

        if (typeof invalidName === "string") {
            throw new Error(`Invalid event name. Event names must not contain $: "${invalidName}"`);
        }

        return new PluvRouter<
            TIO,
            InferSchemaOutput<TPresenceSchema>,
            InferStorage<TCrdt>,
            TEvents
        >(events);
    }

    private _logDebug(...data: any[]): void {
        if (typeof process === "undefined") return;
        if (process.env?.NODE_ENV === "production") return;

        if (this._debug) console.log(...data);
    }
}
