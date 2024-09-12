import type { AbstractCrdtDocFactory, CrdtType } from "@pluv/crdt";
import type { InputZodLike, IOLike, JsonObject } from "@pluv/types";
import { PluvProcedure } from "./PluvProcedure";
import type { AuthEndpoint, PluvRoomAddon, PluvRoomDebug, RoomConfig, RoomEndpoints, WsEndpoint } from "./PluvRoom";
import { PluvRoom } from "./PluvRoom";
import type { PluvRouterEventConfig } from "./PluvRouter";
import { PluvRouter } from "./PluvRouter";
import type { identity } from "./utils";

export type InferCallback<TIO extends IOLike> = (i: typeof identity) => {
    io: (io: TIO) => TIO;
};

export type PluvClientOptions<
    TIO extends IOLike,
    TPresence extends JsonObject,
    TStorage extends Record<string, CrdtType<any, any>>,
    TMetadata extends JsonObject,
> = RoomEndpoints<TIO, TMetadata> & {
    debug?: boolean;
    infer: InferCallback<TIO>;
    initialStorage?: AbstractCrdtDocFactory<TStorage>;
    metadata?: InputZodLike<TMetadata>;
    presence?: InputZodLike<TPresence>;
};

export type CreateRoomOptions<
    TIO extends IOLike,
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
    router?: PluvRouter<TIO, TPresence, TStorage, TEvents>;
} & (keyof TMetadata extends never ? { metadata?: undefined } : { metadata: TMetadata });

export class PluvClient<
    TIO extends IOLike = IOLike,
    TPresence extends JsonObject = {},
    TStorage extends Record<string, CrdtType<any, any>> = {},
    TMetadata extends JsonObject = {},
> {
    private _authEndpoint: AuthEndpoint<TMetadata> | undefined;
    private _debug: boolean;
    private _initialStorage?: AbstractCrdtDocFactory<TStorage>;
    private _presence?: InputZodLike<TPresence>;
    private _wsEndpoint: WsEndpoint<TMetadata> | undefined;

    private _rooms = new Map<string, PluvRoom<TIO, TMetadata, TPresence, TStorage, any>>();

    public get procedure(): PluvProcedure<TIO, {}, {}, TPresence, TStorage> {
        return new PluvProcedure<TIO, {}, {}, TPresence, TStorage>();
    }

    constructor(options: PluvClientOptions<TIO, TPresence, TStorage, TMetadata>) {
        const { authEndpoint, debug = false, initialStorage, presence, wsEndpoint } = options;

        this._authEndpoint = authEndpoint as AuthEndpoint<TMetadata>;
        this._debug = debug;
        this._initialStorage = initialStorage;
        this._presence = presence;
        this._wsEndpoint = wsEndpoint;
    }

    public createRoom = <TEvents extends PluvRouterEventConfig<TIO, TPresence, TStorage> = {}>(
        room: string,
        options: CreateRoomOptions<TIO, TPresence, TStorage, TMetadata, TEvents>,
    ): PluvRoom<TIO, TMetadata, TPresence, TStorage> => {
        const oldRoom = this.getRoom(room);

        if (oldRoom) return oldRoom;

        const newRoom = new PluvRoom<TIO, TMetadata, TPresence, TStorage, TEvents>(room, {
            addons: options.addons,
            authEndpoint: this._authEndpoint,
            debug: options.debug,
            initialPresence: options.initialPresence,
            initialStorage: this._initialStorage,
            metadata: options.metadata,
            onAuthorizationFail: options.onAuthorizationFail,
            presence: this._presence,
            wsEndpoint: this._wsEndpoint,
        } as RoomConfig<TIO, TMetadata, TPresence, TStorage, TEvents>);

        this._rooms.set(room, newRoom);

        this._logDebug(`New room was created: ${room}`);

        return newRoom;
    };

    public enter = async (
        room: string | PluvRoom<TIO, any, any, any>,
    ): Promise<PluvRoom<TIO, TMetadata, TPresence, TStorage, any>> => {
        const toEnter = typeof room === "string" ? this.getRoom(room) : room;

        if (!toEnter) throw new Error(`Could not find room: ${room}.`);

        this._rooms.set(toEnter.id, toEnter);

        await toEnter.connect();

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
        return new PluvRouter<TIO, TPresence, TStorage, TEvents>(events);
    }

    private _logDebug(...data: any[]): void {
        // eslint-disable-next-line turbo/no-undeclared-env-vars
        if (process?.env?.NODE_ENV === "production") return;

        this._debug && console.log(...data);
    }
}
