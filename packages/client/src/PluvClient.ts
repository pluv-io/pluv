import type { CrdtType } from "@pluv/crdt";
import type { IOLike, JsonObject } from "@pluv/types";
import { PluvProcedure } from "./PluvProcedure";
import type { AuthEndpoint, PluvRoomOptions, RoomConfig, RoomEndpoints, WsEndpoint } from "./PluvRoom";
import { PluvRoom } from "./PluvRoom";
import type { PluvRouterEventConfig } from "./PluvRouter";
import { PluvRouter } from "./PluvRouter";

export type PluvClientOptions<TIO extends IOLike, TMetadata extends JsonObject> = RoomEndpoints<TIO, TMetadata> & {
    debug?: boolean;
};

export type GetHelpersParams<
    TIO extends IOLike,
    TPresence extends JsonObject = {},
    TStorage extends Record<string, CrdtType<any, any>> = {},
> = Pick<PluvRoomOptions<TIO, any, TPresence, TStorage>, "initialStorage" | "presence">;

export interface PluvClientHelpers<
    TIO extends IOLike,
    TPresence extends JsonObject = {},
    TStorage extends Record<string, CrdtType<any, any>> = {},
> {
    procedure: PluvProcedure<TIO, {}, {}, TPresence, TStorage>;
    router: <TEvents extends PluvRouterEventConfig<TIO, TPresence, TStorage> = {}>(
        events: TEvents,
    ) => PluvRouter<TIO, TPresence, TStorage, TEvents>;
}

export class PluvClient<TIO extends IOLike = IOLike, TMetadata extends JsonObject = {}> {
    private _authEndpoint: AuthEndpoint<TMetadata> | undefined;
    private _debug: boolean;
    private _wsEndpoint: WsEndpoint<TMetadata> | undefined;

    private _rooms = new Map<string, PluvRoom<TIO, TMetadata, any, any>>();

    constructor(options: PluvClientOptions<TIO, TMetadata>) {
        const { authEndpoint, debug = false, wsEndpoint } = options;

        this._authEndpoint = authEndpoint as AuthEndpoint<TMetadata>;
        this._debug = debug;
        this._wsEndpoint = wsEndpoint;
    }

    public createRoom = <TPresence extends JsonObject = {}, TStorage extends Record<string, CrdtType<any, any>> = {}>(
        room: string,
        options: PluvRoomOptions<TIO, TMetadata, TPresence, TStorage>,
    ): PluvRoom<TIO, TMetadata, TPresence, TStorage> => {
        const oldRoom = this.getRoom<TPresence, TStorage>(room);

        if (oldRoom) return oldRoom;

        const newRoom = new PluvRoom<TIO, TMetadata, TPresence, TStorage>(room, {
            addons: options.addons,
            authEndpoint: this._authEndpoint,
            debug: options.debug,
            initialPresence: options.initialPresence,
            initialStorage: options.initialStorage,
            metadata: options.metadata,
            onAuthorizationFail: options.onAuthorizationFail,
            wsEndpoint: this._wsEndpoint,
        } as RoomConfig<TIO, TMetadata, TPresence, TStorage>);

        this._rooms.set(room, newRoom);

        this._logDebug(`New room was created: ${room}`);

        return newRoom;
    };

    public enter = async (
        room: string | PluvRoom<TIO, any, any, any>,
    ): Promise<PluvRoom<TIO, TMetadata, JsonObject, any>> => {
        const toEnter = typeof room === "string" ? this.getRoom(room) : room;

        if (!toEnter) throw new Error(`Could not find room: ${room}.`);

        this._rooms.set(toEnter.id, toEnter);

        await toEnter.connect();

        this._logDebug(`Entered room: ${room}`);

        return toEnter;
    };

    public getHelpers<TPresence extends JsonObject = {}, TStorage extends Record<string, CrdtType<any, any>> = {}>(
        params: GetHelpersParams<TIO, TPresence, TStorage>,
    ): PluvClientHelpers<TIO, TPresence, TStorage> {
        return {
            get procedure(): PluvProcedure<TIO, {}, {}, TPresence, TStorage> {
                return new PluvProcedure<TIO, {}, {}, TPresence, TStorage>();
            },
            router: <TEvents extends PluvRouterEventConfig<TIO, TPresence, TStorage> = {}>(
                events: TEvents,
            ): PluvRouter<TIO, TPresence, TStorage, TEvents> => {
                return new PluvRouter<TIO, TPresence, TStorage, TEvents>(events);
            },
        };
    }

    public getRoom = <TPresence extends JsonObject = {}, TStorage extends Record<string, CrdtType<any, any>> = {}>(
        room: string,
    ): PluvRoom<TIO, TMetadata, TPresence, TStorage> | null => {
        const found = this._rooms.get(room) as PluvRoom<TIO, TMetadata, TPresence, TStorage> | undefined;

        return found ?? null;
    };

    public getRooms = (): readonly PluvRoom<TIO, TMetadata, JsonObject, any>[] => {
        return Array.from(this._rooms.values());
    };

    public leave = async (room: string | PluvRoom<TIO, any, any, any>): Promise<void> => {
        const toLeave = typeof room === "string" ? this.getRoom(room) : room;

        if (!toLeave) return;

        await toLeave.disconnect();

        this._rooms.delete(toLeave.id);

        this._logDebug(`Left and deleted room: ${room}`);
    };

    private _logDebug(...data: any[]): void {
        // eslint-disable-next-line turbo/no-undeclared-env-vars
        if (process?.env?.NODE_ENV === "production") return;

        this._debug && console.log(...data);
    }
}
