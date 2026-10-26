import type {
    IODefs,
    RoomEffects,
    RoomJoinActor,
    RoomPresenceSession,
    RoomStorageActor,
    SessionRoom,
} from "@pluv/io";
import { CommitGate, deferredResultPromise, isDeferredResult, isSuspended } from "@pluv/io";
import type { JsonObject } from "@pluv/types";
import { plain } from "./plain";
import type { FrameDelivery, PresenceDelivery, StorageFrameDelivery } from "./types";

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
    deferredResult: Promise<T>,
): Promise<
    { status: "value"; value: T } | { status: "error"; error: unknown } | { status: "pending" }
> => {
    let settled:
        | { status: "value"; value: T }
        | { status: "error"; error: unknown }
        | { status: "pending" } = { status: "pending" };

    deferredResult.then(
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
 * Forwards one room call and returns plain JSON. A deferred result that is still
 * waiting becomes `{ suspended: true }`. The frames are delivered later on
 * the `RpcTarget` the caller passed in, which this facet retains until that
 * send finishes.
 */
export class RoomFacet<T extends IODefs = IODefs> {
    readonly #keepAlive: (promise: Promise<unknown>) => void;
    readonly #room: Room;
    readonly #storageTurn = new CommitGate();

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

        if (!isDeferredResult(settled)) return plain.json(settled);

        const deferredResult = deferredResultPromise(settled);
        const ready = await readSettled(deferredResult);

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
            deferredResult,
        });

        return { suspended: true };
    }

    public async applyStorageProcedure(params: {
        actor: RoomStorageActor;
        data: unknown;
        name: string;
        onFrames: StorageFrameDelivery;
    }): Promise<RoomEffects | { error?: { message: string } | null; suspended: true }> {
        const settled = await this.#room["~"].applyStorageProcedure({
            actor: params.actor,
            data: params.data,
            name: params.name,
        });

        if (!isDeferredResult(settled)) return plain.effects(settled);

        const pending = deferredResultPromise(settled);
        const ready = await readSettled(pending);

        // Already settled, so this RPC can reject the host call. `{ suspended: true }`
        // would wait for a `finish` that never runs.
        if (ready.status === "error") throw ready.error;

        // These frames are already the commit. A loaded procedure is the other value.
        if (ready.status === "value") {
            const value = ready.value;

            if ("broadcast" in value) return plain.effects(value);

            // The earlier commit has finished, and this load has too. Commit while
            // the caller's queue is still held.
            if (this.#storageTurn.idle) {
                const turn = this.#storageTurn.reserve();

                try {
                    return plain.effects(await this.#room["~"].commitLoadedStorage(value));
                } finally {
                    turn.finish();
                }
            }
        }

        const turn = this.#storageTurn.reserve();
        const loaded = ready.status === "value" ? Promise.resolve(ready.value) : pending;

        // `{ suspended: true }` leaves the host call open until `finish`.
        // Waiting for the previous commit here would hold the caller's queue.
        // `send` writes after that turn, off this RPC.
        this.#deliver({
            onReject: async (sink, error) => {
                // The host call rejects with this error. The caller logs it.
                try {
                    await sink.deliverFrames({
                        attachments: [],
                        broadcast: [],
                        closes: [],
                        connectionId: params.actor.id,
                        destroy: false,
                        error: null,
                        self: [],
                        storageDirty: false,
                    });
                } finally {
                    turn.finish();
                    await sink.finish(plain.error(error));
                }
            },
            send: async (sink, value) => {
                try {
                    let finished = false;

                    // `null` resolves the host call with empty effects. The frames
                    // were already sent. An error rejects the call.
                    const finish = async (error: unknown): Promise<void> => {
                        if (finished) return;

                        finished = true;
                        await sink.finish(error ? plain.error(error) : null);
                    };

                    try {
                        // `false` runs off the queue, so this write does not pull
                        // updates another turn is writing.
                        const effects =
                            "broadcast" in value
                                ? value
                                : await this.#room["~"].commitLoadedStorage(value, false);
                        const delivered = plain.effects(effects);

                        try {
                            await sink.deliverFrames(delivered);
                        } catch (error) {
                            try {
                                const replay = procedureReplay(delivered);

                                if (replay) await sink.retryUnsent(replay);
                            } finally {
                                // The successful send never queued this frame. A failed one
                                // still needs the snapshot loop to broadcast it.
                                this.#room["~"].queueStorageFrames(delivered.broadcast);

                                if (delivered.storageDirty) await sink.noteStorageDirty();
                            }

                            // The write has already landed, and the snapshot loop still broadcasts it.
                            // The host call rejects anyway. Falling through would `finish(null)`.
                            throw error;
                        }

                        await this.#room["~"].dropStorageUpdates(delivered.broadcast);
                        await finish(null);
                    } catch (error) {
                        console.error(error);

                        try {
                            if (await this.#room["~"].storageDirty()) await sink.noteStorageDirty();
                        } finally {
                            await finish(error);
                        }
                    }
                } finally {
                    turn.finish();
                }
            },
            sink: params.onFrames,
            deferredResult: turn.previous.then(
                () => loaded,
                () => loaded,
            ),
        });

        return { suspended: true };
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

    public queueStorageFrames(frames: Readonly<RoomEffects["broadcast"]>): void {
        this.#room["~"].queueStorageFrames(frames);
    }

    public async flushSnapshot(): Promise<{ broadcast: unknown; status: unknown }> {
        return plain.json(await this.#room["~"].flushSnapshot());
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

        if (isDeferredResult(settled)) {
            const deferredResult = deferredResultPromise(settled);
            const ready = await readSettled(deferredResult);

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
                deferredResult,
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
        /** Sends `$error` when the deferred result rejects. */
        onReject?: (kept: TSink, error: unknown) => void | Promise<void>;
        /**
         * Sends the resolved value. A throw is logged here. Storage finishes
         * the host call in `send` and does not rethrow.
         */
        send: (kept: TSink, value: TValue) => void | Promise<void>;
        /** Supervisor stub passed into this RPC. Retained until delivery finishes. */
        sink: TSink;
        /** Resolves to frames or a presence patch. */
        deferredResult: Promise<TValue>;
    }): void {
        const { deferredResult, onReject, send, sink } = params;
        const kept = retain(sink);
        const delivery = deferredResult
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
