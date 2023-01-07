import type { IOLike, JsonObject } from "@pluv/types";
import { AbstractType } from "yjs";
import type {
    AuthEndpoint,
    RoomEndpoints,
    PluvRoomOptions,
    WsEndpoint,
} from "./PluvRoom";
import { PluvRoom } from "./PluvRoom";

export type PluvClientOptions<TIO extends IOLike> = RoomEndpoints<TIO> & {
    debug?: boolean;
};

export class PluvClient<TIO extends IOLike = IOLike> {
    private _authEndpoint: AuthEndpoint;
    private _debug: boolean;
    private _wsEndpoint: WsEndpoint;

    private _rooms = new Map<string, PluvRoom<TIO, JsonObject, any>>();

    constructor(options: PluvClientOptions<TIO>) {
        const { authEndpoint, debug = false, wsEndpoint } = options;

        this._authEndpoint = authEndpoint as AuthEndpoint;
        this._debug = debug;
        this._wsEndpoint = wsEndpoint;
    }

    public createRoom = <
        TPresence extends JsonObject = {},
        TStorage extends Record<string, AbstractType<any>> = {}
    >(
        room: string,
        options: PluvRoomOptions<TIO, TPresence, TStorage>
    ): PluvRoom<TIO, TPresence, TStorage> => {
        const oldRoom = this.getRoom<TPresence, TStorage>(room);

        if (oldRoom) return oldRoom;

        const newRoom = new PluvRoom<TIO, TPresence, TStorage>(room, {
            authEndpoint: this._authEndpoint,
            debug: options.debug,
            initialPresence: options.initialPresence,
            initialStorage: options.initialStorage,
            onAuthorizationFail: options.onAuthorizationFail,
            wsEndpoint: this._wsEndpoint,
        });

        this._rooms.set(room, newRoom);

        this._logDebug(`New room was created: ${room}`);

        return newRoom;
    };

    public enter = async (
        room: string | PluvRoom<TIO, JsonObject, any>
    ): Promise<void> => {
        const toEnter = typeof room === "string" ? this.getRoom(room) : room;

        if (!toEnter) {
            throw new Error(`Could not find room: ${room}.`);
        }

        this._rooms.set(toEnter.id, toEnter);

        await toEnter.connect();

        this._logDebug(`Entered room: ${room}`);
    };

    public getRoom = <
        TPresence extends JsonObject = {},
        TStorage extends Record<string, AbstractType<any>> = {}
    >(
        room: string
    ): PluvRoom<TIO, TPresence, TStorage> | null => {
        const found = this._rooms.get(room) as
            | PluvRoom<TIO, TPresence, TStorage>
            | undefined;

        return found ?? null;
    };

    public getRooms = (): readonly PluvRoom<TIO, JsonObject, any>[] => {
        return Array.from(this._rooms.values());
    };

    public leave = (room: string | PluvRoom<TIO, JsonObject, any>): void => {
        const toLeave = typeof room === "string" ? this.getRoom(room) : room;

        if (!toLeave) return;

        toLeave.disconnect();

        this._rooms.delete(toLeave.id);

        this._logDebug(`Left and deleted room: ${room}`);
    };

    private _logDebug(...data: any[]): void {
        // eslint-disable-next-line turbo/no-undeclared-env-vars
        if (process?.env?.NODE_ENV === "production") return;

        this._debug && console.log(...data);
    }
}
