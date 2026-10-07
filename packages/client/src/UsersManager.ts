import type {
    BaseIOEventRecord,
    IOLike,
    InferIOAuthorize,
    OperatorUser,
    ParticipantKind,
    ParticipantKindOptions,
    ParticipantKindsOptions,
    RoomStats,
    StandardSchemaV1,
    UserInfo,
} from "@pluv/types";
import { PLUV_PRESENCE_META_KEY } from "./constants";
import type { PluvClientLimits } from "./types";
import { assertExhaustive } from "./utils/assertExhaustive";
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
    kind: ParticipantKind;
    operator?: OperatorUser | null;
    presence?: TPresence;
    presenceSeq?: number | null;
};

export type AddConnectionResult<TIO extends IOLike, TPresence extends Record<string, any> = {}> = {
    data: UserInfo<TIO, TPresence>;
    isMyself: boolean;
    presenceChanged: boolean;
    remaining: number;
};

export type DeleteConnectionResult<
    TIO extends IOLike,
    TPresence extends Record<string, any> = {},
> = {
    data: UserInfo<TIO, TPresence>;
    remaining: number;
};

export type OthersSnapshotRow<TIO extends IOLike, TPresence extends Record<string, any> = {}> = {
    connectionIds: readonly string[];
    data: UserInfo<TIO, TPresence>["data"];
    kind: ParticipantKind;
    operator?: OperatorUser | null;
    presence: TPresence | null;
    presenceSeq?: number | null;
};

export type ApplyPresenceResult<TPresence extends Record<string, any> = {}> = {
    applied: boolean;
    presence: TPresence;
};

type ClientKey = {
    kind: ParticipantKind;
    id: string;
};

export class UsersManager<TIO extends IOLike, TPresence extends Record<string, any> = {}> {
    public readonly initialPresence: TPresence;

    private readonly _idMap = {
        fromConnectionId: new Map<string, ClientKey>(),
        fromClientKey: {
            operator: new Map<string, Set<string>>(),
            user: new Map<string, Set<string>>(),
        },
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
    private _operators = new Map<string, UserInfo<TIO, TPresence>>();
    private _others = new Map<string, UserInfo<TIO, TPresence>>();
    private _presence: StandardSchemaV1<any, TPresence> | null = null;
    private _presenceSeqs = {
        operator: new Map<string, number | null>(),
        user: new Map<string, number | null>(),
    };
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
        const info = this._toUserInfo(params, presence);
        const clientKey = this._clientKeyFromInfo(info);
        const myClientKey = this._myself ? this._clientKeyFromInfo(this._myself) : null;
        const remaining = this._setConnectionId(params.connectionId, clientKey).size;

        if (this._sameClientKey(myClientKey, clientKey)) {
            return {
                data: this._myself ?? info,
                isMyself: true,
                presenceChanged: false,
                remaining,
            };
        }

        const others = this._mapForKind(clientKey.kind);
        const other = others.get(clientKey.id);

        if (!other) {
            others.set(clientKey.id, info);
            this._setPresenceSeq(clientKey, params.presenceSeq ?? null);

            return {
                data: info,
                isMyself: false,
                presenceChanged: true,
                remaining,
            };
        }

        const presenceChanged = this._isNewerPresenceSeq(clientKey, params.presenceSeq);

        if (presenceChanged) {
            others.set(clientKey.id, info);
            this._setPresenceSeq(clientKey, params.presenceSeq);
        }

        return {
            data: others.get(clientKey.id) ?? info,
            isMyself: false,
            presenceChanged,
            remaining,
        };
    }

    public clearConnections(): void {
        this.removeMyself();
        this._operators.clear();
        this._others.clear();
        this._presenceSeqs.operator.clear();
        this._presenceSeqs.user.clear();
        this._localPresenceInFlight = 0;
        this._idMap.fromClientKey.operator.clear();
        this._idMap.fromClientKey.user.clear();
        this._idMap.fromConnectionId.clear();
    }

    public deleteConnection(connectionId: string): DeleteConnectionResult<TIO, TPresence> | null {
        const clientKey = this._clientKeyForConnection(connectionId);

        this._deleteConnectionId(connectionId);

        if (!clientKey) return null;

        const userInfo = this._getByClientKey(clientKey);

        if (!userInfo) return null;

        const remaining = this._getConnectionIds(clientKey)?.size ?? 0;
        const result: DeleteConnectionResult<TIO, TPresence> = {
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
            this._mapForKind(clientKey.kind).delete(clientKey.id);
            this._presenceSeqsForKind(clientKey.kind).delete(clientKey.id);
        }

        return result;
    }

    /**
     * Public participant id. Both kinds use `data.id`.
     */
    public getParticipantId(info: UserInfo<TIO, TPresence>): string {
        return this._clientKeyFromInfo(info).id;
    }

    public isMyselfConnection(connectionId: string): boolean {
        if (!this._myself) return false;

        return this._sameClientKey(
            this._clientKeyForConnection(connectionId),
            this._clientKeyFromInfo(this._myself),
        );
    }

    public getOther(
        userId: string,
        options?: ParticipantKindOptions,
    ): UserInfo<TIO, TPresence> | null {
        const kind = options?.kind ?? "user";

        switch (kind) {
            case "user":
                return this._others.get(userId) ?? null;
            case "operator":
                return this._operators.get(userId) ?? null;
            default:
                return assertExhaustive(kind);
        }
    }

    public getOtherByConnectionId(
        connectionId: string,
        options?: ParticipantKindsOptions,
    ): UserInfo<TIO, TPresence> | null {
        const clientKey = this._clientKeyForConnection(connectionId);

        if (!clientKey) return null;

        const info = this._getByClientKey(clientKey);

        if (!info) return null;

        const kinds = options?.kinds ?? ["user"];

        return kinds.includes(info.kind) ? info : null;
    }

    public getOthers(options?: ParticipantKindsOptions): readonly UserInfo<TIO, TPresence>[] {
        const kinds = options?.kinds ?? ["user"];
        const others: UserInfo<TIO, TPresence>[] = [];

        if (kinds.includes("user")) others.push(...this._others.values());
        if (kinds.includes("operator")) others.push(...this._operators.values());

        return others;
    }

    public getOccupancy(options?: ParticipantKindsOptions): RoomStats {
        const kinds = new Set(options?.kinds ?? ["user"]);
        const myselfKind = this._myself?.kind ?? "user";
        const includeMyself = !!this._myself && kinds.has(myselfKind);
        const myClientKey = this._myself ? this._clientKeyFromInfo(this._myself) : null;
        let connectionCount = 0;

        this._idMap.fromConnectionId.forEach((clientKey) => {
            const info = this._sameClientKey(clientKey, myClientKey)
                ? this._myself
                : this._getByClientKey(clientKey);

            if (info && kinds.has(info.kind)) connectionCount += 1;
        });

        const userCount =
            (kinds.has("user") ? this._others.size : 0) +
            (kinds.has("operator") ? this._operators.size : 0) +
            (includeMyself ? 1 : 0);

        return { connectionCount, userCount };
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
        params: { connectionId: string } & BaseIOEventRecord<
            InferIOAuthorize<TIO>
        >["$presenceUpdated"],
    ): ApplyPresenceResult<TPresence> | null {
        const { connectionId, session, user } = params;
        const { operator, presence: patch, seq } = session;
        const presenceSeq = seq.presence;
        const clientKey = this._clientKeyForConnection(connectionId);
        const myClientKey = this._myself ? this._clientKeyFromInfo(this._myself) : null;

        if (!clientKey) return null;

        if (this._sameClientKey(myClientKey, clientKey)) {
            if (!this._shouldApplyPresenceSeq(clientKey, presenceSeq)) {
                return { applied: false, presence: this._myself?.presence ?? this._myPresence };
            }

            return {
                applied: true,
                presence: this.updateMyPresence(patch as Partial<TPresence>, presenceSeq),
            };
        }

        const other = this._getByClientKey(clientKey);

        if (!other) return null;

        if (!this._shouldApplyPresenceSeq(clientKey, presenceSeq)) {
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

        this._mapForKind(clientKey.kind).set(clientKey.id, {
            ...other,
            data: user,
            operator,
            presence: validated,
        });
        this._setPresenceSeq(clientKey, presenceSeq);

        return { applied: true, presence: validated };
    }

    public pruneConnections(activeConnectionIds: ReadonlySet<string>): UserInfo<TIO, TPresence>[] {
        const myClientKey = this._myself ? this._clientKeyFromInfo(this._myself) : null;
        const left: UserInfo<TIO, TPresence>[] = [];

        Array.from(this._idMap.fromConnectionId.keys()).forEach((connectionId) => {
            if (activeConnectionIds.has(connectionId)) return;

            const clientKey = this._clientKeyForConnection(connectionId);

            if (!clientKey || this._sameClientKey(clientKey, myClientKey)) return;

            const deleted = this.deleteConnection(connectionId);

            if (deleted && !deleted.remaining) left.push(deleted.data);
        });

        return left;
    }

    public removeMyself(): void {
        if (!this._myself) return;

        const clientKey = this._clientKeyFromInfo(this._myself);
        const connectionIds = this._getConnectionIds(clientKey);

        connectionIds?.forEach((connectionId) => {
            this._idMap.fromConnectionId.delete(connectionId);
        });
        this._connectionsForKind(clientKey.kind).delete(clientKey.id);
        this._presenceSeqsForKind(clientKey.kind).delete(clientKey.id);
        this._localPresenceInFlight = 0;
        this._myself = null;
    }

    public replaceOthers(
        rows: readonly OthersSnapshotRow<TIO, TPresence>[],
    ): { id: string; kind: ParticipantKind }[] {
        const myClientKey = this._myself ? this._clientKeyFromInfo(this._myself) : null;
        const previousUsers = new Map(this._others);
        const previousOperators = new Map(this._operators);
        const previousUserSeqs = new Map(this._presenceSeqs.user);
        const previousOperatorSeqs = new Map(this._presenceSeqs.operator);

        Array.from(this._idMap.fromConnectionId.entries()).forEach(([connectionId, clientKey]) => {
            if (this._sameClientKey(clientKey, myClientKey)) return;

            this._idMap.fromConnectionId.delete(connectionId);
        });
        Array.from(this._idMap.fromClientKey.user.keys()).forEach((id) => {
            if (myClientKey?.kind === "user" && myClientKey.id === id) return;

            this._idMap.fromClientKey.user.delete(id);
        });
        Array.from(this._idMap.fromClientKey.operator.keys()).forEach((id) => {
            if (myClientKey?.kind === "operator" && myClientKey.id === id) return;

            this._idMap.fromClientKey.operator.delete(id);
        });
        this._others.clear();
        this._operators.clear();
        this._presenceSeqs.user.clear();
        this._presenceSeqs.operator.clear();

        if (myClientKey) {
            const mySeq = (() => {
                switch (myClientKey.kind) {
                    case "user":
                        return previousUserSeqs.get(myClientKey.id);
                    case "operator":
                        return previousOperatorSeqs.get(myClientKey.id);
                    default:
                        return assertExhaustive(myClientKey.kind);
                }
            })();

            if (mySeq !== undefined) this._setPresenceSeq(myClientKey, mySeq);
        }

        rows.forEach((row) => {
            const cleaned = pickBy(row.presence ?? {}, (value) => typeof value !== "undefined");
            const snapshotPresence = { ...this.initialPresence, ...cleaned } as TPresence;
            const info = this._toUserInfo(row, snapshotPresence);
            const clientKey = this._clientKeyFromInfo(info);
            const previous = (() => {
                switch (clientKey.kind) {
                    case "user":
                        return previousUsers.get(clientKey.id);
                    case "operator":
                        return previousOperators.get(clientKey.id);
                    default:
                        return assertExhaustive(clientKey.kind);
                }
            })();
            const previousSeq = (() => {
                switch (clientKey.kind) {
                    case "user":
                        return previousUserSeqs.get(clientKey.id);
                    case "operator":
                        return previousOperatorSeqs.get(clientKey.id);
                    default:
                        return assertExhaustive(clientKey.kind);
                }
            })();
            const snapshotNewer = this._isNewerPresenceSeqValue(previousSeq, row.presenceSeq);

            if (previous && !snapshotNewer) {
                this._mapForKind(previous.kind).set(clientKey.id, previous);
                this._setPresenceSeq(clientKey, previousSeq ?? null);
            } else {
                this._mapForKind(info.kind).set(clientKey.id, info);
                this._setPresenceSeq(clientKey, row.presenceSeq ?? null);
            }

            row.connectionIds.forEach((connectionId) => {
                this._setConnectionId(connectionId, clientKey);
            });
        });

        const left: { id: string; kind: ParticipantKind }[] = [];

        previousUsers.forEach((_, id) => {
            if (!this._others.has(id)) left.push({ id, kind: "user" });
        });
        previousOperators.forEach((_, id) => {
            if (!this._operators.has(id)) left.push({ id, kind: "operator" });
        });

        return left;
    }

    public setMyself(params: AddConnectionParams<TIO, TPresence>): void {
        const presence = params.presence ?? this.initialPresence;
        const info = this._toUserInfo(params, presence);
        const clientKey = this._clientKeyFromInfo(info);

        this._myself = info;
        this._myPresence = presence;
        this._setPresenceSeq(clientKey, params.presenceSeq ?? null);

        this._setConnectionId(params.connectionId, clientKey);
    }

    public setMyConnectionIds(connectionIds: readonly string[]): void {
        if (!this._myself) return;

        const clientKey = this._clientKeyFromInfo(this._myself);
        const previous = this._getConnectionIds(clientKey);

        previous?.forEach((connectionId) => {
            this._idMap.fromConnectionId.delete(connectionId);
        });
        this._connectionsForKind(clientKey.kind).delete(clientKey.id);

        connectionIds.forEach((connectionId) => {
            this._setConnectionId(connectionId, clientKey);
        });
    }

    public setPresence(
        connectionId: string,
        presence: TPresence,
        presenceSeq?: number | null,
    ): void {
        const clientKey = this._clientKeyForConnection(connectionId);
        const myClientKey = this._myself ? this._clientKeyFromInfo(this._myself) : null;

        if (!clientKey) return;
        if (!this._shouldApplyPresenceSeq(clientKey, presenceSeq)) return;

        if (this._sameClientKey(myClientKey, clientKey)) {
            if (!this._myself) return;

            this._myself.presence = presence;
            this._myPresence = presence;
            this._setPresenceSeq(clientKey, presenceSeq);

            return;
        }

        const other = this._getByClientKey(clientKey);

        if (!other) return;

        this._mapForKind(clientKey.kind).set(clientKey.id, { ...other, presence });
        this._setPresenceSeq(clientKey, presenceSeq);
    }

    /**
     * @description This method need not care about being connected. This is because a user should
     * be able to view and update their own presence without being online
     * @date April 20, 2025
     */
    public updateMyPresence(patch: Partial<TPresence>, presenceSeq?: number | null): TPresence {
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
        this._setPresenceSeq(this._clientKeyFromInfo(this._myself), presenceSeq);

        return updated;
    }

    private _toUserInfo(
        params: {
            data: UserInfo<TIO, TPresence>["data"];
            kind: ParticipantKind;
            operator?: OperatorUser | null;
        },
        presence: TPresence,
    ): UserInfo<TIO, TPresence> {
        switch (params.kind) {
            case "operator":
                return {
                    data: params.data,
                    kind: params.kind,
                    operator: params.operator ?? null,
                    presence,
                };
            case "user":
                return {
                    data: params.data,
                    kind: params.kind,
                    operator: null,
                    presence,
                };
            default:
                return assertExhaustive(params.kind);
        }
    }

    private _clientKeyForConnection(connectionId: string): ClientKey | null {
        return this._idMap.fromConnectionId.get(connectionId) ?? null;
    }

    private _clientKeyFromInfo(info: UserInfo<TIO, TPresence>): ClientKey {
        const id = info.data && typeof info.data.id === "string" ? info.data.id : null;

        if (!id) throw new Error("Could not resolve user id");

        switch (info.kind) {
            case "operator":
            case "user":
                return { kind: info.kind, id };
            default:
                return assertExhaustive(info.kind);
        }
    }

    private _sameClientKey(a: ClientKey | null, b: ClientKey | null): boolean {
        return !!a && !!b && a.kind === b.kind && a.id === b.id;
    }

    private _mapForKind(kind: ParticipantKind): Map<string, UserInfo<TIO, TPresence>> {
        switch (kind) {
            case "operator":
                return this._operators;
            case "user":
                return this._others;
            default:
                return assertExhaustive(kind);
        }
    }

    private _presenceSeqsForKind(kind: ParticipantKind): Map<string, number | null> {
        switch (kind) {
            case "operator":
                return this._presenceSeqs.operator;
            case "user":
                return this._presenceSeqs.user;
            default:
                return assertExhaustive(kind);
        }
    }

    private _connectionsForKind(kind: ParticipantKind): Map<string, Set<string>> {
        switch (kind) {
            case "operator":
                return this._idMap.fromClientKey.operator;
            case "user":
                return this._idMap.fromClientKey.user;
            default:
                return assertExhaustive(kind);
        }
    }

    private _getByClientKey(clientKey: ClientKey): UserInfo<TIO, TPresence> | null {
        return this._mapForKind(clientKey.kind).get(clientKey.id) ?? null;
    }

    /**
     * Extra-tab joins and occupancy snapshots only replace presence when the
     * incoming seq is a newer number. Connecting with no seq is not an
     * interact. Equal seqs keep the value already applied.
     */
    private _isNewerPresenceSeq(clientKey: ClientKey, incoming?: number | null): boolean {
        return this._isNewerPresenceSeqValue(
            this._presenceSeqsForKind(clientKey.kind).get(clientKey.id),
            incoming,
        );
    }

    private _isNewerPresenceSeqValue(
        previous: number | null | undefined,
        incoming?: number | null,
    ): boolean {
        if (typeof incoming !== "number") return false;
        if (typeof previous !== "number") return true;

        return incoming > previous;
    }

    /**
     * Local writes omit a seq and always apply. Remote writes apply when the
     * seq is newer or equal (last-applied wins among equal seqs).
     * A null seq applies only when we do not already have one.
     */
    private _shouldApplyPresenceSeq(clientKey: ClientKey, incoming?: number | null): boolean {
        if (incoming === undefined) return true;
        if (typeof incoming !== "number") {
            return typeof this._presenceSeqsForKind(clientKey.kind).get(clientKey.id) !== "number";
        }

        const previous = this._presenceSeqsForKind(clientKey.kind).get(clientKey.id);

        if (typeof previous !== "number") return true;

        return incoming >= previous;
    }

    private _setPresenceSeq(clientKey: ClientKey, incoming?: number | null): void {
        if (typeof incoming === "number") {
            this._presenceSeqsForKind(clientKey.kind).set(clientKey.id, incoming);
            return;
        }

        if (incoming === undefined) {
            return;
        }

        this._presenceSeqsForKind(clientKey.kind).set(clientKey.id, null);
    }

    private _deleteConnectionId(connectionId: string): void {
        const clientKey = this._clientKeyForConnection(connectionId);

        this._idMap.fromConnectionId.delete(connectionId);

        if (!clientKey) return;

        const connections = this._connectionsForKind(clientKey.kind);
        const set = connections.get(clientKey.id) ?? null;

        if (!set) return;

        set.delete(connectionId);

        if (!!set.size) return;

        connections.delete(clientKey.id);
    }

    private _getConnectionIds(clientKey: ClientKey): Set<string> | null {
        return this._connectionsForKind(clientKey.kind).get(clientKey.id) ?? null;
    }

    private _setConnectionId(connectionId: string, clientKey: ClientKey): Set<string> {
        const connections = this._connectionsForKind(clientKey.kind);
        const set = connections.get(clientKey.id) ?? new Set<string>();
        const updated = set.add(connectionId);

        this._idMap.fromConnectionId.set(connectionId, clientKey);
        connections.set(clientKey.id, updated);

        return updated;
    }
}
