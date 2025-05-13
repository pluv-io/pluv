import type { JsonObject, OthersSubscriptionEvent, RoomLike, UserInfo } from "@pluv/types";
import { ObservableV2 } from "lib0/observable";
import type { Doc as YDoc } from "yjs";
import { PLUV_PRESENCE_META_KEY, PLUV_PRESENCE_Y_ID_KEY, PLUV_PRESENCE_Y_KEY } from "../constants";
import { MetaClientState, YjsAwarenessUpdate } from "../types";

export interface PluvYjsAwarenessParams {
    doc: YDoc;
    room: RoomLike<any>;
}

export class PluvYjsAwareness extends ObservableV2<{
    change: (updates: YjsAwarenessUpdate, kind: "presence") => void;
    destroy: (awareness: PluvYjsAwareness) => void;
    update: (updates: YjsAwarenessUpdate, kind: "local" | "presence") => void;
}> {
    public readonly doc: YDoc;

    // Unstructured presence data we aren't going to validate
    private readonly _idMap = new Map<[connectionId: string][0], [clientID: number][0]>();
    private readonly _room: RoomLike<any>;
    private readonly _unsubscribe: () => void;

    public get clientID(): number {
        return this.doc.clientID;
    }

    public get states(): Map<number, JsonObject> {
        return this.getStates();
    }

    constructor(params: PluvYjsAwarenessParams) {
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
        });

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

    public getLocalState(): JsonObject | null {
        const myPresence = this._room.getMyPresence() as any;
        const myMeta = myPresence?.[PLUV_PRESENCE_META_KEY] || {};
        const myState: JsonObject | undefined = myMeta[PLUV_PRESENCE_Y_KEY];

        const hasPresence = !!Object.keys(myPresence ?? {}).length;
        const hasState = typeof myState !== "undefined";

        return hasPresence && hasState ? myState : null;
    }

    public setLocalState(state: JsonObject | null): void {
        const myPresence = this._room.getMyPresence() as any;
        const myMeta = myPresence?.[PLUV_PRESENCE_META_KEY] || {};
        const myState: JsonObject | undefined = myMeta[PLUV_PRESENCE_Y_KEY];

        if (state === null) {
            // Skip extraneous presence update if we don't need it
            if (typeof myPresence === "undefined") return;

            this._room.updateMyPresence({
                [PLUV_PRESENCE_META_KEY]: { ...myMeta, [PLUV_PRESENCE_Y_KEY]: null },
            });
            this.emit("update", [{ added: [], updated: [], removed: [this.clientID] }, "local"]);

            return;
        }

        this._room.updateMyPresence({
            [PLUV_PRESENCE_META_KEY]: {
                ...myMeta,
                [PLUV_PRESENCE_Y_KEY]: { ...myState, ...(state || {}) },
            },
        });

        this.emit("update", [
            {
                added: typeof myState === "undefined" ? [this.clientID] : [],
                updated: typeof myState !== "undefined" ? [this.clientID] : [],
                removed: [],
            },
            "local",
        ]);
    }

    public setLocalStateField(field: string, value: JsonObject | null): void {
        const myPresence = this._room.getMyPresence() as any;
        const myMeta = myPresence?.[PLUV_PRESENCE_META_KEY] || {};
        const myState: JsonObject | undefined = myMeta[PLUV_PRESENCE_Y_KEY];

        this._room.updateMyPresence({
            [PLUV_PRESENCE_META_KEY]: {
                ...myMeta,
                [PLUV_PRESENCE_Y_KEY]: { ...myState, [field]: value },
            },
        });
    }

    /**
     * !HACK
     * @description We're building the awareness presences from the states stored on the room's
     * presense instead of using the map defined in the awareness interface.
     * @see https://github.com/yjs/y-protocols/blob/master/awareness.js
     * @date May 13, 2025
     */
    public getStates(): Map<number, JsonObject> {
        const others = this._room.getOthers();

        const states = others.reduce((map, user) => {
            const presence = user.presence as any;
            const meta = presence?.[PLUV_PRESENCE_META_KEY] || {};
            const state: JsonObject | undefined = meta[PLUV_PRESENCE_Y_KEY];
            const clientID: number | undefined = meta[PLUV_PRESENCE_Y_ID_KEY];

            return typeof state !== "undefined" && typeof clientID !== "undefined"
                ? map.set(clientID, state)
                : map;
        }, new Map<number, JsonObject>());

        const myPresence = this._room.getMyPresence() as any;
        const myMeta = myPresence?.[PLUV_PRESENCE_META_KEY] || {};
        const myState: JsonObject | undefined = myMeta[PLUV_PRESENCE_Y_KEY];

        if (typeof myState !== "undefined") states.set(this.clientID, myState);

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

            if (!clientID) return map;

            return map.set(other.connectionId, clientID);
        }, this._idMap);
    }

    /**
     * !HACK
     * @description We dgaf about these fields. We're just mirroring the fields that exist in the
     * og awareness to make sure everything aligns.
     * @see https://github.com/yjs/y-protocols/blob/master/awareness.js
     * @date May 13, 2025
     */
    public readonly meta = new Map<string, MetaClientState>();
    public readonly _checkInterval: number = 0;
}
