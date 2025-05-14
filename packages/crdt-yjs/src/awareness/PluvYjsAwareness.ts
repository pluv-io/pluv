import type {
    CrdtType,
    IOLike,
    JsonObject,
    OthersSubscriptionEvent,
    PluvRouterEventConfig,
    RoomLike,
    UserInfo,
} from "@pluv/types";
import { ObservableV2 } from "lib0/observable";
import type { Doc as YDoc } from "yjs";
import { PLUV_PRESENCE_META_KEY, PLUV_PRESENCE_Y_ID_KEY } from "../constants";
import type { MetaClientState, YjsAwarenessUpdate } from "../types";

export interface PluvYjsAwarenessParams<
    TIO extends IOLike<any>,
    TPresence extends JsonObject,
    TStorage extends Record<string, CrdtType<any, any>>,
    TEvents extends PluvRouterEventConfig,
> {
    doc: YDoc;
    room: RoomLike<TIO, YDoc, TPresence, TStorage, TEvents>;
}

export class PluvYjsAwareness<
    TIO extends IOLike,
    TPresence extends JsonObject,
    TStorage extends Record<string, CrdtType<any, any>>,
    TEvents extends PluvRouterEventConfig,
> extends ObservableV2<{
    change: (updates: YjsAwarenessUpdate, kind: "presence") => void;
    destroy: (awareness: PluvYjsAwareness<TIO, TPresence, TStorage, TEvents>) => void;
    update: (updates: YjsAwarenessUpdate, kind: "local" | "presence") => void;
}> {
    public readonly doc: YDoc;

    private readonly _idMap = new Map<[connectionId: string][0], [clientID: number][0]>();
    private readonly _room: RoomLike<TIO, YDoc, TPresence, TStorage, TEvents>;
    private readonly _unsubscribe: () => void;

    public get clientID(): number {
        return this.doc.clientID;
    }

    public get states(): Map<number, TPresence> {
        return this.getStates();
    }

    constructor(params: PluvYjsAwarenessParams<TIO, TPresence, TStorage, TEvents>) {
        super();

        const { doc, room } = params;

        this.doc = doc;
        this._room = room;

        const myPresence: any = this._room.getMyPresence();
        const myMeta = myPresence?.[PLUV_PRESENCE_META_KEY] || {};

        this._room.updateMyPresence({
            [PLUV_PRESENCE_META_KEY]: {
                ...myMeta,
                [PLUV_PRESENCE_Y_ID_KEY]: this.clientID,
            },
        } as any);

        this._unsubscribe = this._room.subscribe.others((others, event) => {
            const updates = this._deriveUpdates(others, event);

            if (!updates) return;

            this.emit("change", [updates, "presence"]);
            this.emit("update", [updates, "presence"]);
        });
    }

    public destroy(): void {
        this.emit("destroy", [this]);
        this._unsubscribe();
        super.destroy();
    }

    public getLocalState(): TPresence {
        return this._room.getMyPresence();
    }

    public setLocalState(state: TPresence): void {
        this._room.updateMyPresence(state);

        this.emit("update", [{ added: [], updated: [this.clientID], removed: [] }, "local"]);
    }

    public setLocalStateField<TField extends keyof TPresence>(
        field: TField,
        value: TPresence[TField],
    ): void {
        /**
         * !HACK
         * @description Cast to unknown first, because field loses its type of TField when set in
         * an object.
         * @date May 14, 2025
         */
        const patch = { [field]: value } as unknown as Partial<TPresence>;

        this._room.updateMyPresence(patch);
    }

    /**
     * !HACK
     * @description We're building the awareness presences from the states stored on the room's
     * presense instead of using the map defined in the awareness interface.
     * @see https://github.com/yjs/y-protocols/blob/master/awareness.js
     * @date May 13, 2025
     */
    public getStates(): Map<number, TPresence> {
        const others = this._room.getOthers();

        const states = others.reduce((map, user) => {
            const presence = user.presence as any;
            const meta = presence?.[PLUV_PRESENCE_META_KEY] || {};
            const clientID: number | undefined = meta[PLUV_PRESENCE_Y_ID_KEY];

            return typeof presence !== "undefined" && typeof clientID !== "undefined"
                ? map.set(clientID, presence)
                : map;
        }, new Map<number, TPresence>());

        const myPresence = this._room.getMyPresence();

        if (typeof myPresence !== "undefined") states.set(this.clientID, myPresence);

        return states;
    }

    private _deriveUpdates(
        others: readonly UserInfo<any, any>[],
        event: OthersSubscriptionEvent<any, any>,
    ): YjsAwarenessUpdate | null {
        switch (event.kind) {
            case "clear": {
                this._idMap.clear();
                return null;
            }
            case "enter": {
                const clientID = this._resetIdMap(others).get(event.user.connectionId);

                return {
                    added: typeof clientID !== "undefined" ? [clientID] : [],
                    updated: [],
                    removed: [],
                };
            }
            case "leave": {
                const clientID = this._idMap.get(event.user.connectionId);

                this._resetIdMap(others);

                return {
                    added: [],
                    updated: [],
                    removed: typeof clientID !== "undefined" ? [clientID] : [],
                };
            }
            case "sync": {
                this._resetIdMap(others);
                return null;
            }
            case "update": {
                const clientID = this._resetIdMap(others).get(event.user.connectionId);

                return {
                    added: [],
                    updated: typeof clientID !== "undefined" ? [clientID] : [],
                    removed: [],
                };
            }
            default:
                return null;
        }
    }

    private _resetIdMap(others: readonly UserInfo<any, any>[]): Map<string, number> {
        this._idMap.clear();

        return others.reduce((map, other) => {
            const clientID = other.presence[PLUV_PRESENCE_META_KEY]?.[PLUV_PRESENCE_Y_ID_KEY];

            if (typeof clientID === "undefined") return map;

            return map.set(other.connectionId, clientID);
        }, this._idMap);
    }

    /**
     * !HACK
     * @description We dgaf about these. We're just mirroring the fields that exist in the
     * og awareness to make sure everything aligns.
     * @see https://github.com/yjs/y-protocols/blob/master/awareness.js
     * @date May 13, 2025
     */
    public readonly meta = new Map<string, MetaClientState>();
    public readonly _checkInterval: number = 0;
}
