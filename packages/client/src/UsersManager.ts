import type { IOLike, StandardSchemaV1, UserInfo } from "@pluv/types";
import { PLUV_PRESENCE_META_KEY } from "./constants";
import type { PluvClientLimits } from "./types";
import { parsePluvSchema } from "./utils/parsePluvSchema";
import { pickBy } from "./utils/pickBy";

export type Presence = Record<string, unknown>;

export type UsersManagerConfig<TPresence extends Record<string, any> = {}> = {
    initialPresence?: Record<string, any>;
    limits: PluvClientLimits;
    presence?: StandardSchemaV1<any, TPresence>;
};

export type AddConnectionParams<TIO extends IOLike, TPresence extends Record<string, any> = {}> = {
    connectionId: string;
    data: UserInfo<TIO, TPresence>["data"];
    presence?: TPresence;
    presenceTimer?: number | null;
};

export type AddConnectionResult<TIO extends IOLike, TPresence extends Record<string, any> = {}> = {
    clientId: string;
    data: UserInfo<TIO, TPresence>;
    isMyself: boolean;
    presenceChanged: boolean;
    remaining: number;
};

export type DeleteConnectionResult<
    TIO extends IOLike,
    TPresence extends Record<string, any> = {},
> = {
    clientId: string;
    data: UserInfo<TIO, TPresence>;
    remaining: number;
};

export type OthersSnapshotRow<TIO extends IOLike, TPresence extends Record<string, any> = {}> = {
    connectionIds: readonly string[];
    data: UserInfo<TIO, TPresence>["data"];
    presence: TPresence | null;
    presenceTimer?: number | null;
};

export type ApplyPresenceResult<TPresence extends Record<string, any> = {}> = {
    applied: boolean;
    presence: TPresence;
};

export class UsersManager<TIO extends IOLike, TPresence extends Record<string, any> = {}> {
    public readonly initialPresence: TPresence;

    private readonly _idMap = {
        fromConnectionId: new Map<[connectionId: string][0], [clientId: string][0]>(),
        fromClientId: new Map<[clientId: string][0], Set<[connectionId: string][0]>>(),
    };
    private _limits: PluvClientLimits;
    /**
     * @description This presence can be updated while the user is not
     * connected.
     */
    private _myPresence: TPresence;
    /**
     * @description This is only set when the user is connected.
     */
    private _myself: UserInfo<TIO, TPresence> | null = null;
    private _others = new Map<[clientId: string][0], UserInfo<TIO, TPresence>>();
    private _presence: StandardSchemaV1<any, TPresence> | null = null;
    private _presenceTimers = new Map<[clientId: string][0], number | null>();
    /**
     * Own `$updatePresence` broadcasts not yet echoed on this connection.
     * Per-tab only; other tabs are a different connectionId.
     */
    private _localPresenceInFlight = 0;

    constructor(config: UsersManagerConfig<TPresence>) {
        const { initialPresence, limits, presence = null } = config;

        this._presence = presence;
        this._limits = limits;

        const resolved = presence
            ? parsePluvSchema(presence, initialPresence ?? {})
            : ((initialPresence ?? {}) as TPresence);

        this.initialPresence = resolved;
        this._myPresence = resolved;
    }

    public get myPresence(): TPresence {
        return this._myPresence;
    }

    public get myself(): UserInfo<TIO, TPresence> | null {
        return this._myself;
    }

    public addConnection(
        params: AddConnectionParams<TIO, TPresence>,
    ): AddConnectionResult<TIO, TPresence> {
        /**
         * @description Ensure that the presence is complete, so that it does not fail schema
         * validation
         * @date April 20, 2025
         */
        const cleaned = pickBy(params.presence ?? {}, (value) => typeof value !== "undefined");
        const presence = { ...this.initialPresence, ...cleaned } as TPresence;
        const info: UserInfo<TIO, TPresence> = { data: params.data, presence };
        const clientId = this._clientIdFromData(params.data);
        const myClientId = this._myself ? this.getClientId(this._myself) : null;
        const remaining = this._setConnectionId(params.connectionId, clientId).size;

        if (myClientId === clientId) {
            return {
                clientId,
                data: this._myself ?? info,
                isMyself: true,
                presenceChanged: false,
                remaining,
            };
        }

        const other = this._others.get(clientId);

        if (!other) {
            this._others.set(clientId, info);
            this._setPresenceTimer(clientId, params.presenceTimer ?? null);

            return {
                clientId,
                data: info,
                isMyself: false,
                presenceChanged: true,
                remaining,
            };
        }

        const presenceChanged = this._isNewerPresenceTimer(clientId, params.presenceTimer);

        if (presenceChanged) {
            this._others.set(clientId, info);
            this._setPresenceTimer(clientId, params.presenceTimer);
        }

        return {
            clientId,
            data: this._others.get(clientId) ?? info,
            isMyself: false,
            presenceChanged,
            remaining,
        };
    }

    public clearConnections(): void {
        this.removeMyself();
        this._others.clear();
        this._presenceTimers.clear();
        this._localPresenceInFlight = 0;
        this._idMap.fromClientId.clear();
        this._idMap.fromConnectionId.clear();
    }

    public deleteConnection(connectionId: string): DeleteConnectionResult<TIO, TPresence> | null {
        const clientId = this.getClientId(connectionId);

        this._deleteConnectionId(connectionId);

        if (!clientId) return null;

        const userInfo = this._others.get(clientId) ?? null;

        if (!userInfo) return null;

        const remaining = this._getConnectionIds(clientId)?.size ?? 0;
        const result: DeleteConnectionResult<TIO, TPresence> = {
            clientId,
            remaining,
            data: userInfo,
        };

        /**
         * @description A user may have multiple websocket connections open. If one connection is
         * dropped, the user may still be connected via another websocket (e.g. on anther browser
         * tab). In this case, we just want to remove the connection mapping for the connection
         * that is dropped, but keep the remaining connections and the user.
         * @date April 16, 2025
         */
        if (!remaining) {
            this._others.delete(clientId);
            this._presenceTimers.delete(clientId);
        }

        return result;
    }

    /**
     * @description The client id is the authorized user's id. This is so that, despite having
     * multiple connections, the user will only have one presence to all other users.
     * @date April 16, 2025
     */
    public getClientId(connectionId: string): string | null;
    public getClientId(userInfo: UserInfo<TIO, TPresence>): string;
    public getClientId(input: string | UserInfo<TIO, TPresence>): string | null {
        if (typeof input !== "string") {
            if (input.data && typeof input.data.id === "string") return input.data.id;

            throw new Error("Could not resolve user id");
        }

        return this._idMap.fromConnectionId.get(input) ?? null;
    }

    public getOther(userId: string): UserInfo<TIO, TPresence> | null {
        return this._others.get(userId) ?? null;
    }

    public getOtherByConnectionId(connectionId: string): UserInfo<TIO, TPresence> | null {
        const clientId = this.getClientId(connectionId);

        if (!clientId) return null;

        return this._others.get(clientId) ?? null;
    }

    public getOthers(): readonly UserInfo<TIO, TPresence>[] {
        return Array.from(this._others.values());
    }

    public getOccupancy(): { connectionCount: number; userCount: number } {
        return {
            connectionCount: this._idMap.fromConnectionId.size,
            userCount: this._others.size + (this._myself ? 1 : 0),
        };
    }

    public beginLocalPresenceWrite(): void {
        this._localPresenceInFlight += 1;
    }

    /**
     * @returns Whether this own-connection echo should apply. Stale echoes
     * during a burst of local writes return false so they cannot rewind.
     */
    public ackOwnPresenceEcho(): boolean {
        if (this._localPresenceInFlight > 0) this._localPresenceInFlight -= 1;

        return this._localPresenceInFlight === 0;
    }

    public patchPresence(
        connectionId: string,
        patch: Partial<TPresence>,
        presenceTimer?: number | null,
    ): ApplyPresenceResult<TPresence> | null {
        const clientId = this.getClientId(connectionId);
        const myClientId = this._myself ? this.getClientId(this._myself) : null;

        if (!clientId) return null;

        if (myClientId === clientId) {
            if (!this._shouldApplyPresenceTimer(clientId, presenceTimer)) {
                return { applied: false, presence: this._myself?.presence ?? this._myPresence };
            }

            return { applied: true, presence: this.updateMyPresence(patch, presenceTimer) };
        }

        const other = this._others.get(clientId);

        if (!other) return null;

        if (!this._shouldApplyPresenceTimer(clientId, presenceTimer)) {
            return { applied: false, presence: other.presence };
        }

        const cleanedPatch = pickBy(patch ?? {}, (value) => typeof value !== "undefined");
        const cleanedPresence = pickBy(
            other.presence ?? {},
            (value) => typeof value !== "undefined",
        );
        const presence = {
            ...this.initialPresence,
            ...cleanedPresence,
            ...cleanedPatch,
        } as TPresence;
        const validated = this._presence ? parsePluvSchema(this._presence, presence) : presence;

        /**
         * !HACK
         * @description We're patching internal metadata back into the presence field so it doesn't
         * get stripped from validation
         * @date May 13, 2025
         */
        if (!!presence[PLUV_PRESENCE_META_KEY]) {
            (validated as any)[PLUV_PRESENCE_META_KEY] = presence[PLUV_PRESENCE_META_KEY];
        }

        this._others.set(clientId, { ...other, presence: validated });
        this._setPresenceTimer(clientId, presenceTimer);

        return { applied: true, presence: validated };
    }

    public pruneConnections(activeConnectionIds: ReadonlySet<string>): UserInfo<TIO, TPresence>[] {
        const myClientId = this._myself ? this.getClientId(this._myself) : null;
        const left: UserInfo<TIO, TPresence>[] = [];

        Array.from(this._idMap.fromConnectionId.keys()).forEach((connectionId) => {
            if (activeConnectionIds.has(connectionId)) return;

            const clientId = this.getClientId(connectionId);

            if (!clientId || clientId === myClientId) return;

            const deleted = this.deleteConnection(connectionId);

            if (deleted && !deleted.remaining) left.push(deleted.data);
        });

        return left;
    }

    public removeMyself(): void {
        if (!this._myself) return;

        const clientId = this.getClientId(this._myself);
        const connectionIds = this._getConnectionIds(clientId);

        connectionIds?.forEach((connectionId) => {
            this._idMap.fromConnectionId.delete(connectionId);
        });
        this._idMap.fromClientId.delete(clientId);
        this._presenceTimers.delete(clientId);
        this._localPresenceInFlight = 0;
        this._myself = null;
    }

    public replaceOthers(rows: readonly OthersSnapshotRow<TIO, TPresence>[]): string[] {
        const myClientId = this._myself ? this.getClientId(this._myself) : null;
        const previousClientIds = Array.from(this._others.keys());
        const previousOthers = new Map(this._others);
        const previousTimers = new Map(
            previousClientIds.map((clientId) => [clientId, this._presenceTimers.get(clientId)]),
        );

        Array.from(this._idMap.fromConnectionId.entries()).forEach(([connectionId, clientId]) => {
            if (clientId === myClientId) return;

            this._idMap.fromConnectionId.delete(connectionId);
        });
        Array.from(this._idMap.fromClientId.keys()).forEach((clientId) => {
            if (clientId === myClientId) return;

            this._idMap.fromClientId.delete(clientId);
        });
        this._others.clear();
        previousClientIds.forEach((clientId) => {
            this._presenceTimers.delete(clientId);
        });

        rows.forEach((row) => {
            const cleaned = pickBy(row.presence ?? {}, (value) => typeof value !== "undefined");
            const snapshotPresence = { ...this.initialPresence, ...cleaned } as TPresence;
            const clientId = this._clientIdFromData(row.data);
            const previous = previousOthers.get(clientId);
            const snapshotNewer = this._isNewerPresenceTimerValue(
                previousTimers.get(clientId),
                row.presenceTimer,
            );

            if (previous && !snapshotNewer) {
                this._others.set(clientId, previous);
                this._setPresenceTimer(clientId, previousTimers.get(clientId) ?? null);
            } else {
                this._others.set(clientId, { data: row.data, presence: snapshotPresence });
                this._setPresenceTimer(clientId, row.presenceTimer ?? null);
            }

            row.connectionIds.forEach((connectionId) => {
                this._setConnectionId(connectionId, clientId);
            });
        });

        const nextClientIds = new Set(this._others.keys());

        return previousClientIds.filter((clientId) => !nextClientIds.has(clientId));
    }

    public setMyself(params: AddConnectionParams<TIO, TPresence>): void {
        const presence = params.presence ?? this.initialPresence;
        const info: UserInfo<TIO, TPresence> = { data: params.data, presence };
        const clientId = this._clientIdFromData(params.data);

        this._myself = info;
        this._myPresence = presence;
        this._setPresenceTimer(clientId, params.presenceTimer ?? null);

        this._setConnectionId(params.connectionId, clientId);
    }

    public setMyConnectionIds(connectionIds: readonly string[]): void {
        if (!this._myself) return;

        const clientId = this.getClientId(this._myself);
        const previous = this._getConnectionIds(clientId);

        previous?.forEach((connectionId) => {
            this._idMap.fromConnectionId.delete(connectionId);
        });
        this._idMap.fromClientId.delete(clientId);

        connectionIds.forEach((connectionId) => {
            this._setConnectionId(connectionId, clientId);
        });
    }

    public setPresence(
        connectionId: string,
        presence: TPresence,
        presenceTimer?: number | null,
    ): void {
        const clientId = this.getClientId(connectionId);
        const myClientId = this._myself ? this.getClientId(this._myself) : null;

        if (!clientId) return;
        if (!this._shouldApplyPresenceTimer(clientId, presenceTimer)) return;

        if (myClientId === clientId) {
            if (!this._myself) return;

            this._myself.presence = presence;
            this._myPresence = presence;
            this._setPresenceTimer(clientId, presenceTimer);

            return;
        }

        const other = this._others.get(clientId);

        if (!other) return;

        this._others.set(clientId, { ...other, presence });
        this._setPresenceTimer(clientId, presenceTimer);
    }

    /**
     * @description This method need not care about being connected. This is because a user should
     * be able to view and update their own presence without being online
     * @date April 20, 2025
     */
    public updateMyPresence(patch: Partial<TPresence>, presenceTimer?: number | null): TPresence {
        const cleanedPatch = pickBy(patch, (value) => typeof value !== "undefined");
        const cleanedPresence = pickBy(this._myPresence, (value) => typeof value !== "undefined");
        const updated = {
            ...this.initialPresence,
            ...cleanedPresence,
            ...cleanedPatch,
        } as TPresence;
        const bytes = new TextEncoder().encode(JSON.stringify(updated)).length;

        if (!!this._limits.presenceMaxSize && bytes > this._limits.presenceMaxSize) {
            throw new Error(
                `Large presence. Presence must be at most 512 bytes. Current size: ${bytes.toLocaleString()}`,
            );
        }

        this._myPresence = updated;

        if (!this._myself) return updated;

        this._myself.presence = updated;
        this._setPresenceTimer(this.getClientId(this._myself), presenceTimer);

        return updated;
    }

    private _clientIdFromData(data: UserInfo<TIO, TPresence>["data"]): string {
        if (data && typeof data.id === "string") return data.id;

        throw new Error("Could not resolve user id");
    }

    /**
     * Extra-tab joins and occupancy snapshots only replace presence when the
     * incoming timer is a newer number. Connecting with no clock is not an
     * interact. Equal clocks keep the value already applied.
     */
    private _isNewerPresenceTimer(clientId: string, incoming?: number | null): boolean {
        return this._isNewerPresenceTimerValue(this._presenceTimers.get(clientId), incoming);
    }

    private _isNewerPresenceTimerValue(
        previous: number | null | undefined,
        incoming?: number | null,
    ): boolean {
        if (typeof incoming !== "number") return false;
        if (typeof previous !== "number") return true;

        return incoming > previous;
    }

    /**
     * Local writes omit a timer and always apply. Remote writes apply when the
     * timer is newer or equal (last-applied wins among same-millisecond writes).
     * A null clock applies only when we do not already have one.
     */
    private _shouldApplyPresenceTimer(clientId: string, incoming?: number | null): boolean {
        if (incoming === undefined) return true;
        if (typeof incoming !== "number") {
            return typeof this._presenceTimers.get(clientId) !== "number";
        }

        const previous = this._presenceTimers.get(clientId);

        if (typeof previous !== "number") return true;

        return incoming >= previous;
    }

    private _setPresenceTimer(clientId: string, incoming?: number | null): void {
        if (typeof incoming === "number") {
            this._presenceTimers.set(clientId, incoming);
            return;
        }

        if (incoming === undefined) {
            return;
        }

        this._presenceTimers.set(clientId, null);
    }

    private _deleteConnectionId(connectionId: string): void {
        const clientId = this.getClientId(connectionId);

        this._idMap.fromConnectionId.delete(connectionId);

        if (!clientId) return;

        const set = this._idMap.fromClientId.get(clientId) ?? null;

        if (!set) return;

        set.delete(connectionId);

        if (!!set.size) return;

        this._idMap.fromClientId.delete(clientId);
    }

    private _getConnectionIds(clientId: string): Set<[connectionId: string][0]> | null {
        const set = this._idMap.fromClientId.get(clientId);

        return set ?? null;
    }

    private _setConnectionId(
        connectionId: string,
        clientId: string,
    ): Set<[connectionId: string][0]> {
        const set = this._idMap.fromClientId.get(clientId) ?? new Set<string>();
        const updated = set.add(connectionId);

        this._idMap.fromConnectionId.set(connectionId, clientId);
        this._idMap.fromClientId.set(clientId, updated);

        return updated;
    }
}
