import type { CrdtType } from "@pluv/crdt";
import type { IOLike, JsonObject } from "@pluv/types";
import type { RoomConfig } from "./PluvRoom";
import { PluvRoom } from "./PluvRoom";

export type PluvClientOptions<TIO extends IOLike> = {
    debug?: boolean;
};

export class PluvClient<TIO extends IOLike = IOLike> {
    private _debug: boolean;

    private _rooms = new Map<string, PluvRoom<TIO, any, any>>();

    constructor(options: PluvClientOptions<TIO> = {}) {
        const { debug = false } = options;

        this._debug = debug;
    }

    public createRoom = <TPresence extends JsonObject = {}, TStorage extends Record<string, CrdtType<any, any>> = {}>(
        room: string,
        options: RoomConfig<TIO, TPresence, TStorage>,
    ): PluvRoom<TIO, TPresence, TStorage> => {
        const oldRoom = this.getRoom<TPresence, TStorage>(room);

        if (oldRoom) return oldRoom;

        const newRoom = new PluvRoom<TIO, TPresence, TStorage>(room, {
            addons: options.addons,
            authEndpoint: options.authEndpoint,
            debug: options.debug,
            initialPresence: options.initialPresence,
            initialStorage: options.initialStorage,
            onAuthorizationFail: options.onAuthorizationFail,
            wsEndpoint: options.wsEndpoint,
        } as RoomConfig<TIO, TPresence, TStorage>);

        this._rooms.set(room, newRoom);

        this._logDebug(`New room was created: ${room}`);

        return newRoom;
    };

    public enter = async (room: string | PluvRoom<TIO, any, any>): Promise<PluvRoom<TIO, JsonObject, any>> => {
        const toEnter = typeof room === "string" ? this.getRoom(room) : room;

        if (!toEnter) {
            throw new Error(`Could not find room: ${room}.`);
        }

        this._rooms.set(toEnter.id, toEnter);

        await toEnter.connect();

        this._logDebug(`Entered room: ${room}`);

        return toEnter;
    };

    public getRoom = <TPresence extends JsonObject = {}, TStorage extends Record<string, CrdtType<any, any>> = {}>(
        room: string,
    ): PluvRoom<TIO, TPresence, TStorage> | null => {
        const found = this._rooms.get(room) as PluvRoom<TIO, TPresence, TStorage> | undefined;

        return found ?? null;
    };

    public getRooms = (): readonly PluvRoom<TIO, JsonObject, any>[] => {
        return Array.from(this._rooms.values());
    };

    public leave = async (room: string | PluvRoom<TIO, any, any>): Promise<void> => {
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
