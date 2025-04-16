import type { Id, InferIOAuthorize, InferIOAuthorizeUser, InputZodLike, IOLike, JsonObject } from "@pluv/types";
import type { UserInfo } from "./types";

export type Presence = Record<string, unknown>;

export type UsersManagerConfig<TPresence extends JsonObject = {}> = {
    initialPresence?: TPresence;
    presence?: InputZodLike<TPresence>;
};

export class UsersManager<TIO extends IOLike, TPresence extends JsonObject = {}> {
    private _idMap = new Map<[connectionId: string][0], [clientId: string][0]>();
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

    public clear(): void {
        this._others.clear();
    }

    /**
     * @description The client id is either the user's id (if authorized) or the connection id
     * otherwise. This is so that, despite having multiple connections, the user will only have one
     * presence to all other users.
     * @date April 16, 2025
     */
    public getClientId(userInfo: UserInfo<TIO, TPresence>): string {
        const connectionId = userInfo.connectionId;
        const userId = userInfo.user?.id ?? null;

        return userId ?? connectionId;
    }

    public getOther(connectionId: string): UserInfo<TIO, TPresence> | null {
        const clientId = this._idMap.get(connectionId);

        if (!clientId) return null;

        return this._others.get(clientId) ?? null;
    }

    public getOthers(): readonly UserInfo<TIO, TPresence>[] {
        return Array.from(this._others.values());
    }

    public patchPresence(connectionId: string, patch: Partial<TPresence>): void {
        const clientId = this._idMap.get(connectionId) ?? null;
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

    public removeUser(connectionId: string): void {
        const clientId = this._idMap.get(connectionId);

        this._idMap.delete(connectionId);

        if (!clientId) return;

        const hasRemainingConnection = Array.from(this._idMap.values()).includes(clientId);

        /**
         * @description A user may have multiple websocket connections open. If one connection is
         * dropped, the user may still be connected via another websocket (e.g. on anther browser
         * tab). In this case, we just want to remove the connection mapping for the connection
         * that is dropped, but keep the remaining connections and the user.
         * @date April 16, 2025
         */
        if (hasRemainingConnection) return;

        this._others.delete(clientId);
    }

    public removeUsers(): void {
        this._others.clear();
    }

    public setMyself(connectionId: string, user: Id<InferIOAuthorizeUser<InferIOAuthorize<TIO>>>): void {
        this._myself = {
            connectionId,
            presence: this._initialPresence,
            user,
        };

        this._myPresence = this._initialPresence;
    }

    public setPresence(connectionId: string, presence: TPresence): void {
        const clientId = this._idMap.get(connectionId) ?? null;
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

    public setUser(
        connectionId: string,
        user: Id<InferIOAuthorizeUser<InferIOAuthorize<TIO>>>,
        presence?: TPresence,
    ): void {
        const clientId = this._idMap.get(connectionId) ?? null;
        const myClientId = !!this._myself ? this.getClientId(this._myself) : null;

        if (!clientId) return;
        if (myClientId === clientId) return;

        const other = this._others.get(clientId);

        if (other) return;

        this._others.set(clientId, {
            connectionId,
            presence: presence ?? this._initialPresence,
            user,
        });
    }

    /**
     * @description This method need not care about being connected.
     */
    public updateMyPresence(patch: Partial<TPresence>): void {
        this._myPresence = { ...this._myPresence, ...patch };

        if (!this._myself) return;

        this._myself.presence = this._myPresence;
    }
}
