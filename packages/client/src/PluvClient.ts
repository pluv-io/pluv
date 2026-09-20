import type { AbstractCrdtDocFactory, HasStorage, InferSeed, NoopCrdtDocFactory } from "@pluv/crdt";
import { noop } from "@pluv/crdt";
import type { IOLike, InferIOTreaty, StandardSchemaV1, TreatyLike } from "@pluv/types";
import type { ClientDefs, SetKey } from "./ClientDefs";
import { MAX_PRESENCE_SIZE_BYTES } from "./constants";
import type { InferIOLike } from "./infer";
import { PluvProcedure } from "./PluvProcedure";
import { assertSerializingSchema } from "./utils/assertSerializingSchema";
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
    InferClientMetadata,
    InferSchemaInput,
    InferSchemaOutput,
    PluvClientLimits,
    PublicKey,
    WithMetadata,
} from "./types";

export type InferMetadata<TClient extends PluvClient<any>> =
    TClient extends PluvClient<infer TDefs> ? InferSchemaOutput<TDefs["metadata"]> : never;

export type PluvClientOptions<TDefs extends ClientDefs> = RoomEndpoints<
    InferClientMetadata<TDefs>
> & {
    debug?: boolean;
    /**
     * @description Configurable limits defined for client-side validation. You should only set
     * this if you control the server and have changed the limits there.
     */
    limits?: PluvClientLimits;
    metadata?: TDefs["metadata"];
    publicKey?: PublicKey<InferClientMetadata<TDefs>>;
    treaty: TDefs["treaty"];
} & (HasStorage<TDefs["treaty"]["storage"]> extends true
        ? { initialStorage?: InferSeed<TDefs["storage"]> }
        : { initialStorage?: "[ERROR]: Must provide storage on treaty to use initialStorage" });

export type CreateRoomOptions<TDefs extends ClientDefs = ClientDefs> = {
    addons?: readonly PluvRoomAddon<any>[];
    debug?: boolean | PluvRoomDebug<TDefs["io"]>;
    initialPresence?: InferSchemaInput<TDefs["presence"]>;
    initialStorage?: InferSeed<TDefs["storage"]>;
    onAuthorizationFail?: (error: Error) => void;
    reconnectTimeoutMs?: ReconnectTimeoutMs;
    router?: PluvRouter<TDefs>;
};

export type EnterRoomParams<TMetadata extends Record<string, any> = {}> =
    keyof TMetadata extends never ? [] : [WithMetadata<TMetadata>];

export type ConfiguredClientDefs<
    TIO extends IOLike,
    TTreaty extends TreatyLike,
    TMetadataSchema extends StandardSchemaV1<any, any> | undefined,
> = {
    io: InferIOLike<TIO>;
    treaty: TTreaty;
    presence: TTreaty["presence"];
    metadata: TMetadataSchema;
    storage: TTreaty["storage"] extends AbstractCrdtDocFactory<any, any, any, any>
        ? TTreaty["storage"]
        : NoopCrdtDocFactory;
    events: {};
};

export class PluvClient<TDefs extends ClientDefs = ClientDefs> {
    public readonly metadata?: TDefs["metadata"];

    private readonly _authEndpoint: AuthEndpoint<InferClientMetadata<TDefs>>;
    private readonly _debug: boolean;
    private readonly _initialStorage?: InferSeed<TDefs["storage"]>;
    private readonly _limits: PluvClientLimits;
    private readonly _publicKey: PublicKey<InferClientMetadata<TDefs>> | null = null;
    private readonly _rooms = new Map<string, PluvRoom<SetKey<TDefs, "events", any>>>();
    private readonly _treaty: TDefs["treaty"];
    private readonly _wsEndpoint: WsEndpoint<InferClientMetadata<TDefs>> | undefined;

    public get _defs() {
        return {
            initialStorage: this._initialStorage,
            storage: this._treaty.storage,
            treaty: this._treaty,
        };
    }

    public get procedure(): PluvProcedure<TDefs, {}, {}, ""> {
        return new PluvProcedure<TDefs, {}, {}, "">();
    }

    constructor(options: PluvClientOptions<TDefs>) {
        const {
            authEndpoint,
            debug = false,
            initialStorage,
            limits,
            metadata,
            publicKey,
            treaty,
            wsEndpoint,
        } = options as PluvClientOptions<TDefs> & {
            initialStorage?: InferSeed<TDefs["storage"]>;
        };

        this.metadata = metadata;

        if (metadata) {
            assertSerializingSchema(metadata, "Client metadata");
        }

        this._authEndpoint = authEndpoint;
        this._debug = debug;
        this._initialStorage = initialStorage as InferSeed<TDefs["storage"]> | undefined;
        this._limits = {
            presenceMaxSize: MAX_PRESENCE_SIZE_BYTES,
            ...limits,
        };
        this._treaty = treaty;
        this._wsEndpoint = wsEndpoint;

        if (!!publicKey) this._publicKey = publicKey;
    }

    public createRoom = <TEvents extends PluvRouterEventConfig<TDefs> = {}>(
        room: string,
        options: CreateRoomOptions<SetKey<TDefs, "events", TEvents>> = {},
    ): PluvRoom<SetKey<TDefs, "events", TEvents>> => {
        const oldRoom = this.getRoom(room);

        if (oldRoom) return oldRoom as PluvRoom<SetKey<TDefs, "events", TEvents>>;

        const newRoom = new PluvRoom<SetKey<TDefs, "events", TEvents>>(room, {
            addons: options.addons,
            authEndpoint: this._authEndpoint,
            debug: options.debug,
            initialPresence: options.initialPresence,
            initialStorage: options.initialStorage ?? this._initialStorage,
            limits: this._limits,
            metadata: this.metadata,
            onAuthorizationFail: options.onAuthorizationFail,
            presence: this._treaty.presence,
            publicKey: this._publicKey ?? undefined,
            reconnectTimeoutMs: options.reconnectTimeoutMs,
            router: options.router,
            storage:
                (this._treaty.storage as TDefs["storage"] | undefined) ??
                (noop.doc() as TDefs["storage"]),
            treaty: this._treaty,
            wsEndpoint: this._wsEndpoint,
        } as RoomConfig<SetKey<TDefs, "events", TEvents>>);

        this._rooms.set(room, newRoom);

        this._logDebug(`New room was created: ${room}`);

        return newRoom;
    };

    public enter = async (
        room: string | PluvRoom<SetKey<TDefs, "events", any>>,
        ...args: EnterRoomParams<InferSchemaInput<TDefs["metadata"]>>
    ): Promise<PluvRoom<SetKey<TDefs, "events", any>>> => {
        const toEnter = typeof room === "string" ? this.getRoom(room) : room;
        const roomId = typeof room === "string" ? room : room.id;

        if (!toEnter) throw new Error(`Could not find room: ${roomId}.`);

        this._rooms.set(toEnter.id, toEnter);
        await toEnter.connect(...(args as any));

        this._logDebug(`Entered room: ${roomId}`);

        return toEnter;
    };

    public getRoom = (room: string): PluvRoom<SetKey<TDefs, "events", any>> | null => {
        return this._rooms.get(room) ?? null;
    };

    public getRooms = (): readonly PluvRoom<SetKey<TDefs, "events", any>>[] => {
        return Array.from(this._rooms.values());
    };

    public leave = async (room: string | PluvRoom<any>): Promise<void> => {
        const toLeave = typeof room === "string" ? this.getRoom(room) : room;

        if (!toLeave) return;

        await toLeave.disconnect();

        this._rooms.delete(toLeave.id);

        this._logDebug(`Left and deleted room: ${toLeave.id}`);
    };

    public router<TEvents extends PluvRouterEventConfig<TDefs> = {}>(
        events: TEvents,
    ): PluvRouter<SetKey<TDefs, "events", TEvents>> {
        const invalidName = Object.keys(events).find((name) => name.includes("$"));

        if (typeof invalidName === "string") {
            throw new Error(`Invalid event name. Event names must not contain $: "${invalidName}"`);
        }

        return new PluvRouter<SetKey<TDefs, "events", TEvents>>(events);
    }

    private _logDebug(...data: any[]): void {
        if (typeof process === "undefined") return;
        if (process.env?.NODE_ENV === "production") return;

        if (this._debug) console.log(...data);
    }
}

export interface CreateClientBuilder<TIO extends IOLike> {
    config: <
        TTreaty extends InferIOTreaty<TIO>,
        TMetadataSchema extends StandardSchemaV1<any, any> | undefined = undefined,
    >(
        options: PluvClientOptions<ConfiguredClientDefs<TIO, TTreaty, TMetadataSchema>>,
    ) => PluvClient<ConfiguredClientDefs<TIO, TTreaty, TMetadataSchema>>;
}
