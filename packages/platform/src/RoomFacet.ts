import type {
    RoomEffects,
    RoomJoinActor,
    RoomPresenceSession,
    RoomStorageActor,
    SessionRoom,
} from "@pluv/io";
import { isSuspended, isUserTurn, userTurnPromise } from "@pluv/io";
import type { JsonObject } from "@pluv/types";
import { plain } from "./plain";
import type { HostCallback } from "./types";

type Room = SessionRoom<any>;
type Snapshot = Parameters<Room["~"]["close"]>[0];

type RetainedCallback<TArgs extends unknown[]> = HostCallback<TArgs> & {
    dup?: () => RetainedCallback<TArgs>;
    [Symbol.dispose]?: () => void;
};

const retain = <TArgs extends unknown[]>(
    callback: HostCallback<TArgs>,
): RetainedCallback<TArgs> => {
    if ("dup" in callback && typeof callback.dup === "function") {
        return callback.dup();
    }

    return callback;
};

export type RoomFacetOptions = {
    keepAlive: (promise: Promise<unknown>) => void;
    room: Room;
};

/**
 * Forwards one room call and returns plain JSON. A waiting user turn becomes
 * `{ suspended: true }`. The frames are delivered later through the callback.
 */
export class RoomFacet {
    readonly #keepAlive: (promise: Promise<unknown>) => void;
    readonly #room: Room;

    constructor(options: RoomFacetOptions) {
        this.#keepAlive = options.keepAlive;
        this.#room = options.room;
    }

    public async applyPresencePatch(params: {
        data: unknown;
        name: string;
        onPresence: HostCallback<[JsonObject | null]>;
        session: RoomPresenceSession;
    }): Promise<JsonObject | null | { suspended: true }> {
        const settled = await this.#room["~"].applyPresencePatch({
            data: params.data,
            name: params.name,
            session: params.session,
        });

        if (!isUserTurn(settled)) return plain.json(settled);

        this.#deliver(userTurnPromise(settled), params.onPresence, plain.json);

        return { suspended: true };
    }

    public async applyStorageProcedure(params: {
        actor: RoomStorageActor;
        data: unknown;
        name: string;
    }): Promise<RoomEffects> {
        return plain.effects(await this.#room["~"].applyStorageProcedure(params));
    }

    public async close(session: Snapshot): Promise<RoomEffects> {
        return plain.effects(await this.#room["~"].close(session));
    }

    public async destroy(): Promise<null> {
        await this.#room["~"].destroy();

        return null;
    }

    public async flushCheckpoint(): Promise<{ broadcast: unknown; status: unknown }> {
        return plain.json(await this.#room["~"].flushCheckpoint());
    }

    public async garbageCollect(sessions: readonly { id: string }[]): Promise<RoomEffects> {
        return plain.effects(await this.#room["~"].garbageCollect(sessions as never));
    }

    public async initializeStorage(params: {
        actor: RoomJoinActor;
        input: { stateVector?: string | null; update?: string | null };
    }): Promise<{ changeKind: string; state: string | null; storageDirty: boolean }> {
        return plain.json(await this.#room["~"].initializeStorage(params));
    }

    public logDebug(...data: unknown[]): null {
        this.#room["~"].logDebug(...data);

        return null;
    }

    public async message(params: {
        event: { data: unknown; type: string };
        onFrames: HostCallback<[RoomEffects]>;
        session: Snapshot;
    }): Promise<RoomEffects | { suspended: true }> {
        const settled = await this.#room["~"].message(params.session, params.event);

        if (isUserTurn(settled)) {
            this.#deliver(userTurnPromise(settled), params.onFrames, plain.effects);

            return { suspended: true };
        }

        if (isSuspended(settled)) return settled;

        return plain.effects(settled);
    }

    public async register(...options: Parameters<Room["~"]["register"]>): Promise<{
        limits: Room["limits"];
        result: {
            encodedState: string | null;
            error: { message: string } | null;
            kind: string | null;
            operator: unknown;
            user: unknown;
        };
    }> {
        const result = await this.#room["~"].register(...options);

        return {
            limits: plain.json(this.#room.limits),
            result: plain.json({
                encodedState: result.encodedState,
                error: plain.error(result.error),
                kind: result.kind,
                operator: result.operator,
                user: result.user,
            }),
        };
    }

    public storageDirty(): boolean | Promise<boolean> {
        return this.#room["~"].storageDirty();
    }

    public async userConnected(params: {
        encodedState: string | null;
        id: string;
        kind: string;
        operator: unknown;
        user: unknown;
    }): Promise<RoomEffects> {
        return plain.effects(await this.#room["~"].userConnected(params as never));
    }

    public whenReady(): Promise<boolean> {
        return this.#room["~"].whenReady();
    }

    #deliver<T>(promise: Promise<T>, callback: HostCallback<[T]>, map: (value: T) => T): void {
        const kept = retain(callback);
        const delivery = promise
            .then((value) => kept(map(value)))
            .catch((error: unknown) => {
                console.error(error);
            })
            .finally(() => {
                kept[Symbol.dispose]?.();
            });

        this.#keepAlive(delivery);
    }
}
