import type { CrdtType, IOLike, PluvRouterEventConfig, RoomLike } from "@pluv/types";
import { StorageState } from "@pluv/types";
import { ObservableV2 } from "lib0/observable";
import type { Doc as YDoc } from "yjs";
import type { PluvYjsAwareness } from "../awareness";
import { awareness } from "../awareness";
import type { YjsProviderStatus } from "../types";

export interface PluvYjsProviderParams<
    TIO extends IOLike<any>,
    TPresence extends Record<string, any>,
    TStorage extends Record<string, CrdtType<any, any>>,
    TEvents extends PluvRouterEventConfig,
    TField extends keyof TPresence | null = null,
> {
    field?: TField;
    room: RoomLike<TIO, YDoc, TPresence, TStorage, TEvents>;
}

/**
 * !HACK
 * @description This doesn't really do anything but emit states in a Yjs.Provider compatible way.
 * Connections and document syncing are handled by the PluvRoom already.
 * @date May 13, 2025
 */
export class PluvYjsProvider<
    TIO extends IOLike<any>,
    TPresence extends Record<string, any>,
    TStorage extends Record<string, CrdtType<any, any>>,
    TEvents extends PluvRouterEventConfig,
    TField extends keyof TPresence | null = null,
> extends ObservableV2<{
    "connection-close": (
        event: CloseEvent | null,
        provider: PluvYjsProvider<TIO, TPresence, TStorage, TEvents, TField>,
    ) => void;
    "connection-error": (
        event: Event,
        provider: PluvYjsProvider<TIO, TPresence, TStorage, TEvents, TField>,
    ) => void;
    status: (event: { status: YjsProviderStatus }) => void;
    sync: (state: boolean) => void;
    synced: (state: boolean) => void;
}> {
    public readonly awareness: PluvYjsAwareness<TIO, TPresence, TStorage, TEvents, TField>;
    public readonly doc: YDoc;

    private readonly _room: RoomLike<TIO, YDoc, TPresence, TStorage, TEvents>;
    private readonly _unsubscribe: () => void;

    private _synced: boolean = false;

    constructor(params: PluvYjsProviderParams<TIO, TPresence, TStorage, TEvents, TField>) {
        super();

        const { field, room } = params;

        this.awareness = awareness({ field, room });
        this.doc = room.getDoc().value;

        this._room = room;

        const subscriptions = [
            this._room.subscribe.connection(({ storage }) => {
                const status = this._toProviderStatus(storage.state);

                if (!status) return;

                this.emit("status", [{ status }]);
            }),
            this._room.addEventListener("close", (event) => {
                this.emit("connection-close", [event, this]);
            }),
            this._room.addEventListener("error", (event) => {
                this.emit("connection-error", [event, this]);
            }),
        ];

        this._unsubscribe = subscriptions.reduce(
            (fn, unsubscribe) => () => {
                fn();
                unsubscribe();
            },
            () => undefined,
        );
    }

    public get synced(): boolean {
        return this._synced;
    }

    public set synced(state: boolean) {
        if (this._synced === state) return;

        this._synced = state;
        this.emit("sync", [state]);
        this.emit("synced", [state]);
    }

    public destroy(): void {
        this.awareness.destroy();
        this._unsubscribe();
        super.destroy();
    }

    private _toProviderStatus(state: StorageState): YjsProviderStatus | null {
        switch (state) {
            case StorageState.Loading: {
                return "connecting";
            }
            case StorageState.Unavailable: {
                return "disconnected";
            }
            case StorageState.Offline:
            case StorageState.Synced: {
                return "connected";
            }
            default:
                return null;
        }
    }

    /**
     * !HACK
     * @description We dgaf about these, since the room manages these already. We're just mirroring
     * the fields that exist in the og provider to make sure everything aligns.
     * @see https://github.com/yjs/y-websocket/blob/master/src/y-websocket.js
     * @date May 13, 2025
     */
    public connect(): void {}
    public disconnect(): void {}
}
