import type {
    Id,
    InferIOAuthorize,
    InferIOAuthorizeUser,
    InputZodLike,
    IOLike,
    JsonObject,
    OptionalProps,
} from "@pluv/types";
import type { UserInfo } from "./types";

export type Presence = Record<string, unknown>;

export type UsersManagerConfig<TPresence extends JsonObject = {}> = {
    initialPresence?: TPresence;
    presence?: InputZodLike<TPresence>;
};

export type AddConnectionResult<TIO extends IOLike, TPresence extends JsonObject = {}> = {
    clientId: string;
    data: UserInfo<TIO, TPresence>;
    remaining: number;
};

export type DeleteConnectionResult<TIO extends IOLike, TPresence extends JsonObject = {}> = {
    clientId: string;
    data: UserInfo<TIO, TPresence>;
    remaining: number;
};

export class UsersManager<TIO extends IOLike, TPresence extends JsonObject = {}> {
    private _idMap = {
        fromConnectionId: new Map<[connectionId: string][0], [clientId: string][0]>(),
        fromClientId: new Map<[clientId: string][0], Set<[connectionId: string][0]>>(),
    };

    private _initialPresence: TPresence;
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
    private _presence: InputZodLike<TPresence> | null = null;

    constructor(config: UsersManagerConfig<TPresence>) {
        const { initialPresence, presence = null } = config;

        this._initialPresence = initialPresence as TPresence;
        this._myPresence = initialPresence as TPresence;
        this._presence = presence;
    }

    public get myPresence(): TPresence {
        return this._myPresence;
    }

    public get myself(): UserInfo<TIO, TPresence> | null {
        return this._myself;
    }

    public addConnection(
        userInfo: OptionalProps<UserInfo<TIO, TPresence>, "presence">,
    ): AddConnectionResult<TIO, TPresence> | null {
        const data: UserInfo<TIO, TPresence> = {
            ...userInfo,
            presence: userInfo.presence ?? this._initialPresence,
        };

        const myClientId = !!this._myself ? this.getClientId(this._myself) : null;
        const clientId = this.getClientId(data);

        if (myClientId === clientId) return null;

        const other = this._others.get(clientId);
        const remaining = this._setConnectionId(userInfo.connectionId, clientId).size;

        /**
         * !HACK
         * @description Don't override the other user, so that we ensure the user's presence isn't
         * overwritten by whatever incoming connection.
         * @date April 16, 2025
         */
        if (!other) this._others.set(clientId, data);

        const result: AddConnectionResult<TIO, TPresence> = {
            clientId,
            data,
            remaining,
        };

        return result;
    }

    public clearConnections(): void {
        this._others.clear();
        this._idMap.fromClientId.clear();
        this._idMap.fromConnectionId.clear();
    }

    public deleteConnection(connectionId: string): DeleteConnectionResult<TIO, TPresence> | null {
        const clientId = this.getClientId(connectionId);

        this._deleteConnectionId(connectionId);

        // We expect that a clientId should always exist here, but we'll just check this anyways
        if (!clientId) return null;

        const userInfo = this._others.get(clientId) ?? null;

        // We also expect this should always exist here, but we'll just check this anyways
        if (!userInfo) return null;

        const remaining = this._getConnectionIds(clientId)?.size ?? 0;
        const result: DeleteConnectionResult<TIO, TPresence> = { clientId, remaining, data: userInfo };

        /**
         * @description A user may have multiple websocket connections open. If one connection is
         * dropped, the user may still be connected via another websocket (e.g. on anther browser
         * tab). In this case, we just want to remove the connection mapping for the connection
         * that is dropped, but keep the remaining connections and the user.
         * @date April 16, 2025
         */
        if (!remaining) this._others.delete(clientId);

        return result;
    }

    /**
     * @description The client id is either the user's id (if authorized) or the connection id
     * otherwise. This is so that, despite having multiple connections, the user will only have one
     * presence to all other users.
     * @date April 16, 2025
     */
    public getClientId(connectionId: string): string | null;
    public getClientId(userInfo: UserInfo<TIO, TPresence>): string;
    public getClientId(input: string | UserInfo<TIO, TPresence>): string | null {
        if (typeof input !== "string") {
            const userInfo = input;
            const connectionId = userInfo.connectionId;
            const userId = userInfo.user?.id ?? null;

            return userId ?? connectionId;
        }

        const connectionId = input;

        if (this._myself?.connectionId === connectionId) {
            return this.getClientId(this._myself);
        }

        const clientId = this._idMap.fromConnectionId.get(connectionId) ?? null;

        return clientId;
    }

    public getOther(connectionId: string): UserInfo<TIO, TPresence> | null {
        const clientId = this.getClientId(connectionId);

        if (!clientId) return null;

        return this._others.get(clientId) ?? null;
    }

    public getOthers(): readonly UserInfo<TIO, TPresence>[] {
        return Array.from(this._others.values());
    }

    public patchPresence(connectionId: string, patch: Partial<TPresence>): void {
        const clientId = this.getClientId(connectionId);
        const myClientId = !!this._myself ? this.getClientId(this._myself) : null;

        if (!clientId) return;
        if (myClientId === clientId) {
            this.updateMyPresence(patch);
            return;
        }

        const other = this._others.get(clientId);

        if (!other) return;

        const presence = { ...other.presence, ...patch } as TPresence;
        const validated = this._presence ? this._presence.parse(presence) : presence;

        this._others.set(clientId, { ...other, presence: validated });
    }

    public removeMyself(): void {
        this._myself = null;
    }

    public setMyself(userInfo: OptionalProps<UserInfo<TIO, TPresence>, "presence">): void {
        const presence = userInfo.presence ?? this._initialPresence;

        this._myself = { ...userInfo, presence };
        this._myPresence = presence;
    }

    public setPresence(connectionId: string, presence: TPresence): void {
        const clientId = this.getClientId(connectionId);
        const myClientId = !!this._myself ? this.getClientId(this._myself) : null;

        if (!clientId) return;

        if (myClientId === clientId) {
            if (!this._myself) return;

            this._myself.presence = presence;
            this._myPresence = presence;

            return;
        }

        const other = this._others.get(clientId);

        if (!other) return;

        this._others.set(clientId, { ...other, presence });
    }

    /**
     * @description This method need not care about being connected.
     */
    public updateMyPresence(patch: Partial<TPresence>): void {
        this._myPresence = { ...this._myPresence, ...patch };

        if (!this._myself) return;

        this._myself.presence = this._myPresence;
    }

    private _deleteConnectionId(connectionId: string): void {
        const clientId = this._idMap.fromConnectionId.get(connectionId) ?? null;

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

    private _setConnectionId(connectionId: string, clientId: string): Set<[connectionId: string][0]> {
        const set = this._idMap.fromClientId.get(clientId) ?? new Set<string>();
        const updated = set.add(connectionId);

        this._idMap.fromConnectionId.set(connectionId, clientId);
        this._idMap.fromClientId.set(clientId, updated);

        return updated;
    }
}
