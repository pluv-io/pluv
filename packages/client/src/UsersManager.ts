import type { Id, InferIOAuthorize, InferIOAuthorizeUser, InputZodLike, IOLike, JsonObject } from "@pluv/types";
import type { UserInfo } from "./types";

export type Presence = Record<string, unknown>;

export type UsersManagerConfig<TPresence extends JsonObject = {}> = {
    initialPresence?: TPresence;
    presence?: InputZodLike<TPresence>;
};

export class UsersManager<TIO extends IOLike, TPresence extends JsonObject = {}> {
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
    private _others = new Map<string, UserInfo<TIO, TPresence>>();
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

    public getOther(connectionId: string): UserInfo<TIO, TPresence> | null {
        return this._others.get(connectionId) ?? null;
    }

    public getOthers(): readonly UserInfo<TIO, TPresence>[] {
        return Array.from(this._others.values());
    }

    public patchPresence(connectionId: string, patch: Partial<TPresence>): void {
        if (this._myself?.connectionId === connectionId) {
            this.updateMyPresence(patch);

            return;
        }

        const other = this._others.get(connectionId);

        if (!other) return;

        const presence = {
            ...other.presence,
            ...patch,
        } as TPresence;

        this._presence?.parse(presence);

        this._others.set(connectionId, { ...other, presence });
    }

    public removeMyself(): void {
        this._myself = null;
    }

    public removeUser(connectionId: string): void {
        this._others.delete(connectionId);
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
        if (this._myself?.connectionId === connectionId) {
            this._myself.presence = presence;
            this._myPresence = presence;

            return;
        }

        const other = this._others.get(connectionId);

        if (!other) return;

        this._others.set(connectionId, { ...other, presence });
    }

    public setUser(
        connectionId: string,
        user: Id<InferIOAuthorizeUser<InferIOAuthorize<TIO>>>,
        presence?: TPresence,
    ): void {
        if (this._myself?.connectionId === connectionId) return;

        const other = this._others.get(connectionId);

        if (other) return;

        this._others.set(connectionId, {
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
