import type {
    IODefs,
    RoomEffects,
    RoomJoinActor,
    RoomPresenceSession,
    RoomStorageActor,
    SessionRoom,
} from "@pluv/io";
import { isSuspended, isUserTurn, userTurnPromise } from "@pluv/io";
import type { JsonObject } from "@pluv/types";
import { plain } from "./plain";
import type { FrameDelivery, PresenceDelivery } from "./types";

type Room = SessionRoom<any>;
type Snapshot = Parameters<Room["~"]["close"]>[0];

/** Broadcast, self, and `$error` still need a send. Storage stays on the pending list. */
const procedureReplay = (effects: RoomEffects): RoomEffects | null => {
    const broadcast = effects.broadcast.filter((frame) => frame.type !== "$storageUpdated");

    if (!broadcast.length && !effects.self.length && !effects.error) return null;

    return {
        ...effects,
        broadcast,
        storageDirty: false,
    };
};

// A stub passed into an RPC is disposed when the call returns. `dup()` keeps a copy.
// https://developers.cloudflare.com/workers/runtime-apis/rpc/lifecycle/#the-dup-method
type Retained<T extends object> = T & {
    dup?: () => Retained<T>;
    [Symbol.dispose]?: () => void;
};

const retain = <T extends object>(target: T): Retained<T> => {
    const source = target as Retained<T>;

    if (typeof source.dup === "function") return source.dup();

    return source;
};

// A turn that settles after this RPC returns still calls back into the caller.
// Yield once so that call is not waiting on this one.
// https://developers.cloudflare.com/workers/runtime-apis/scheduler/
const yieldTurn = (): Promise<void> => {
    if (typeof scheduler !== "undefined") return scheduler.wait(0);

    return new Promise((resolve) => {
        setTimeout(resolve, 0);
    });
};

// An already-settled turn belongs in this RPC result. Delivering it through the
// caller joins the queue that is still waiting here.
const readSettled = async <T>(
    userTurn: Promise<T>,
): Promise<
    { status: "value"; value: T } | { status: "error"; error: unknown } | { status: "pending" }
> => {
    let settled:
        | { status: "value"; value: T }
        | { status: "error"; error: unknown }
        | { status: "pending" } = { status: "pending" };

    userTurn.then(
        (value) => {
            settled = { status: "value", value };
        },
        (error: unknown) => {
            settled = { status: "error", error };
        },
    );

    // Microtasks already queued, including a fast async resolver, finish here.
    // A turn still waiting on I/O stays pending.
    await yieldTurn();

    return settled;
};

export type RoomFacetOptions<T extends IODefs = IODefs> = {
    keepAlive: (promise: Promise<unknown>) => void;
    room: SessionRoom<T>;
};

/**
 * Forwards one room call and returns plain JSON. A user turn that is still
 * waiting becomes `{ suspended: true }`. The frames are delivered later on
 * the `RpcTarget` the caller passed in, which this facet retains until that
 * send finishes.
 */
export class RoomFacet<T extends IODefs = IODefs> {
    readonly #keepAlive: (promise: Promise<unknown>) => void;
    readonly #room: Room;

    constructor(options: RoomFacetOptions<T>) {
        this.#keepAlive = options.keepAlive;
        this.#room = options.room;
    }

    public async applyPresencePatch(params: {
        data: unknown;
        name: string;
        onPresence: PresenceDelivery;
        session: RoomPresenceSession;
    }): Promise<JsonObject | null | { error?: { message: string } | null; suspended: true }> {
        const settled = await this.#room["~"].applyPresencePatch({
            data: params.data,
            name: params.name,
            session: params.session,
        });

        if (!isUserTurn(settled)) return plain.json(settled);

        const userTurn = userTurnPromise(settled);
        const ready = await readSettled(userTurn);

        if (ready.status === "value") return plain.json(ready.value);

        if (ready.status === "error") {
            return { error: plain.error(ready.error), suspended: true };
        }

        this.#deliver({
            onReject: (sink, error) => {
                return sink.deliverPresence({
                    error: plain.error(error),
                    name: params.name,
                    patch: null,
                    senderId: params.session.id,
                });
            },
            send: (sink, patch) => {
                return sink.deliverPresence({
                    error: null,
                    name: params.name,
                    patch: plain.json(patch),
                    senderId: params.session.id,
                });
            },
            sink: params.onPresence,
            userTurn,
        });

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

    public async dropStorageUpdates(frames: Readonly<RoomEffects["broadcast"]>): Promise<void> {
        await this.#room["~"].dropStorageUpdates(frames);
    }

    public async flushCheckpoint(): Promise<{ broadcast: unknown; status: unknown }> {
        return plain.json(await this.#room["~"].flushCheckpoint());
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
        onFrames: FrameDelivery;
        session: Snapshot;
    }): Promise<RoomEffects | { error?: { message: string } | null; suspended: true }> {
        const settled = await this.#room["~"].message(params.session, params.event);

        if (isUserTurn(settled)) {
            const userTurn = userTurnPromise(settled);
            const ready = await readSettled(userTurn);

            if (ready.status === "value") return plain.effects(ready.value);

            if (ready.status === "error") {
                return { error: plain.error(ready.error), suspended: true };
            }

            this.#deliver({
                onReject: (sink, error) => {
                    return sink.deliverFrames(
                        plain.effects({
                            attachments: [],
                            broadcast: [],
                            closes: [],
                            connectionId: params.session.id,
                            destroy: false,
                            error,
                            self: [],
                            storageDirty: false,
                        }),
                    );
                },
                send: async (sink, effects) => {
                    const delivered = plain.effects(effects);

                    try {
                        await sink.deliverFrames(delivered);
                    } catch (error) {
                        try {
                            const replay = procedureReplay(delivered);

                            if (replay) await sink.retryUnsent(replay);
                        } finally {
                            if (delivered.storageDirty) await sink.noteStorageDirty();
                        }

                        throw error;
                    }

                    await this.#room["~"].dropStorageUpdates(delivered.broadcast);
                },
                sink: params.onFrames,
                userTurn,
            });

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

    #deliver<TValue, TSink extends object>(params: {
        /** Sends `$error` when the user turn rejects. */
        onReject?: (kept: TSink, error: unknown) => void | Promise<void>;
        /** Sends the resolved value. A throw is logged and is not a rejected turn. */
        send: (kept: TSink, value: TValue) => void | Promise<void>;
        /** Supervisor stub passed into this RPC. Retained until delivery finishes. */
        sink: TSink;
        /** Resolves to frames or a presence patch. */
        userTurn: Promise<TValue>;
    }): void {
        const { onReject, send, sink, userTurn } = params;
        const kept = retain(sink);
        const delivery = userTurn
            .then(
                async (value) => {
                    await yieldTurn();

                    try {
                        await send(kept, value);
                    } catch (error) {
                        console.error(error);
                    }
                },
                async (error: unknown) => {
                    await yieldTurn();

                    if (!onReject) {
                        console.error(error);

                        return;
                    }

                    try {
                        await onReject(kept, error);
                    } catch (reportError) {
                        console.error(reportError);
                    }
                },
            )
            .finally(() => {
                kept[Symbol.dispose]?.();
            });

        this.#keepAlive(delivery);
    }
}
