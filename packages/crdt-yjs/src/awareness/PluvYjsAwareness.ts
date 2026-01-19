import type {
    CrdtType,
    IOLike,
    OthersSubscriptionEvent,
    PluvRouterEventConfig,
    RoomLike,
    UserInfo,
} from "@pluv/types";
import { ObservableV2 } from "lib0/observable";
import type { Doc as YDoc } from "yjs";
import { PLUV_PRESENCE_META_KEY, PLUV_PRESENCE_Y_ID_KEY } from "../constants";
import type { AwarenessPresence, MetaClientState, YjsAwarenessUpdate } from "../types";

export interface PluvYjsAwarenessParams<
    TIO extends IOLike<any, any, any>,
    TPresence extends Record<string, any>,
    TStorage extends Record<string, CrdtType<any, any>>,
    TEvents extends PluvRouterEventConfig,
    TField extends keyof TPresence | null = null,
> {
    presenceField?: TField;
    room: RoomLike<TIO, YDoc, TPresence, TStorage, TEvents>;
}

export class PluvYjsAwareness<
    TIO extends IOLike,
    TPresence extends Record<string, any>,
    TStorage extends Record<string, CrdtType<any, any>>,
    TEvents extends PluvRouterEventConfig,
    TField extends keyof TPresence | null = null,
> extends ObservableV2<{
    change: (updates: YjsAwarenessUpdate, kind: "presence") => void;
    destroy: (awareness: PluvYjsAwareness<TIO, TPresence, TStorage, TEvents, TField>) => void;
    update: (updates: YjsAwarenessUpdate, kind: "local" | "presence") => void;
}> {
    public readonly doc: YDoc;

    private readonly _field: TField = null as TField;
    private readonly _idMap = new Map<[connectionId: string][0], [clientID: number][0]>();
    private readonly _room: RoomLike<TIO, YDoc, TPresence, TStorage, TEvents>;
    private readonly _unsubscribe: () => void;

    public get clientID(): number {
        return this.doc.clientID;
    }

    public get states(): Map<number, TPresence> {
        return this.getStates();
    }

    constructor(params: PluvYjsAwarenessParams<TIO, TPresence, TStorage, TEvents, TField>) {
        super();

        const { presenceField, room } = params;

        this.doc = room.getDoc().value;
        this._room = room;

        if (!!presenceField) this._field = presenceField;

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

    public getLocalState(): AwarenessPresence<TPresence, TField> {
        return this._adaptPresence(this._room.getMyPresence());
    }

    public setLocalState(state: AwarenessPresence<TPresence, TField>): void {
        const patch = (!!this._field
            ? { [this._field]: state }
            : state) as unknown as Partial<TPresence>;

        this._room.updateMyPresence(patch);

        this.emit("update", [{ added: [], updated: [this.clientID], removed: [] }, "local"]);
    }

    public setLocalStateField<TLocalField extends keyof AwarenessPresence<TPresence, TField>>(
        field: TLocalField,
        value: AwarenessPresence<TPresence, TField>[TLocalField],
    ): void {
        /**
         * !HACK
         * @description Cast to unknown first, because field loses its type of TField when set in
         * an object.
         * @date May 14, 2025
         */
        const patch = (!!this._field
            ? { [this._field]: { ...this.getLocalState(), [field]: value } }
            : { [field]: value }) as unknown as Partial<TPresence>;

        this._room.updateMyPresence(patch);
    }

    /**
     * !HACK
     * @description We're building the awareness presences from the states stored on the room's
     * presense instead of using the map defined in the awareness interface.
     * @see https://github.com/yjs/y-protocols/blob/master/awareness.js
     * @date May 13, 2025
     */
    public getStates(): Map<number, AwarenessPresence<TPresence, TField>> {
        const others = this._room.getOthers();

        const states = others.reduce((map, other) => {
            const presence = this._adaptPresence(other.presence);
            const meta = other.presence?.[PLUV_PRESENCE_META_KEY] || {};
            const clientID: number | undefined = meta[PLUV_PRESENCE_Y_ID_KEY];

            return typeof presence !== "undefined" && typeof clientID !== "undefined"
                ? map.set(clientID, presence)
                : map;
        }, new Map<number, AwarenessPresence<TPresence, TField>>());

        const myPresence = this.getLocalState();

        if (typeof myPresence !== "undefined") states.set(this.clientID, myPresence);

        return states;
    }

    private _adaptPresence(presence: TPresence): AwarenessPresence<TPresence, TField> {
        return (!!this._field ? presence[this._field] : presence) as AwarenessPresence<
            TPresence,
            TField
        >;
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
    public readonly meta = new Map<any, MetaClientState>();
    public readonly _checkInterval: number = 0;
}
