import type {
    Id,
    InferIOAuthorize,
    InferIOAuthorizeUser,
    InputZodLike,
    IOLike,
    JsonObject,
} from "@pluv/types";
import type { UserInfo } from "./types";

export type Presence = Record<string, unknown>;

export type UsersManagerConfig<TPresence extends JsonObject = {}> = {
    initialPresence?: TPresence;
    presence?: InputZodLike<TPresence>;
};

export class UsersManager<
    TIO extends IOLike,
    TPresence extends JsonObject = {}
> {
    private _initialPresence: TPresence;
    private _myself: UserInfo<TIO, TPresence> | null = null;
    private _others = new Map<string, UserInfo<TIO, TPresence>>();
    private _presence: InputZodLike<TPresence> | null = null;

    constructor(config: UsersManagerConfig<TPresence>) {
        const { initialPresence, presence = null } = config;

        this._initialPresence = initialPresence as TPresence;
        this._presence = presence;
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

    public patchPresence(
        connectionId: string,
        patch: Partial<TPresence>
    ): void {
        if (this._myself?.connectionId === connectionId) {
            this._myself.presence = Object.assign(
                Object.create(null),
                this._myself.presence,
                patch
            ) as TPresence;

            return;
        }

        const other = this._others.get(connectionId);

        if (!other) return;

        const presence = Object.assign(
            Object.create(null),
            other.presence,
            patch
        ) as TPresence;

        this._presence?.parse(presence);

        this._others.set(connectionId, { ...other, presence });
    }

    public removeMyself(): void {
        this._myself = null;
    }

    public removeUser(connectionId: string): void {
        this._others.delete(connectionId);
    }

    public setMyself(
        connectionId: string,
        user: Id<InferIOAuthorizeUser<InferIOAuthorize<TIO>>>
    ): void {
        this._myself = {
            connectionId,
            presence: this._initialPresence,
            user,
        };
    }

    public setPresence(connectionId: string, presence: TPresence): void {
        if (this._myself?.connectionId === connectionId) {
            this._myself.presence = presence;

            return;
        }

        const other = this._others.get(connectionId);

        if (!other) return;

        this._others.set(connectionId, { ...other, presence });
    }

    public setUser(
        connectionId: string,
        user: Id<InferIOAuthorizeUser<InferIOAuthorize<TIO>>>
    ): void {
        if (this._myself?.connectionId === connectionId) return;

        const other = this._others.get(connectionId);

        if (other) return;

        this._others.set(connectionId, {
            connectionId,
            presence: this._initialPresence,
            user,
        });
    }
}
