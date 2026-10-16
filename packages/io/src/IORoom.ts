import type { AbstractCrdtDocFactory } from "@pluv/crdt";
import { noop } from "@pluv/crdt";
import type {
    CrdtDocLike,
    InferTreatyProcedureInput,
    IOLike,
    InferEventMessage,
    InferEventsOutput,
    InferTreatyUser,
    JsonObject,
    Maybe,
    MaybePromise,
    OperatorUser,
    ParticipantKind,
} from "@pluv/types";
import colors from "kleur";
import type { InferInitContextType, InferRoomContextType } from "./AbstractPlatform";
import type { IODefs, IOLikeFromDefs } from "./IODefs";
import type { PluvRouter } from "./PluvRouter";
import { RoomStorage } from "./RoomStorage";
import { StorageCheckpoint } from "./StorageCheckpoint";
import { authorize } from "./authorize";
import { PING_TIMEOUT_MS } from "./constants";
import type {
    EventResolverContext,
    GetInitialStorageFn,
    IORoomDestroyedEvent,
    IORoomListenerEvent,
    IORoomMessageEvent,
    IOStorageUpdatedEvent,
    IOUserConnectedEvent,
    IOUserDisconnectedEvent,
    PluvContext,
    PluvIOLimits,
    PluvIOSecret,
    IORoomInternal,
    RoomAttachment,
    RoomEffectFrame,
    RoomEffects,
    RoomJoinActor,
    RoomPresenceSession,
    RoomRegisterResult,
    RoomSessionSnapshot,
    RoomStorageActor,
    SessionEventContext,
    SessionRoom,
    StorageEventContext,
    UserTurn,
    WebSocketRegisterConfig,
    WebSocketSession,
} from "./types";
import { emptyRoomEffects, userTurn } from "./roomEffects";
import {
    assertExhaustive,
    invokeProcedureResolvers,
    isThenable,
    parseOperatorUser,
    parsePluvSchema,
    resolveIOSecret,
} from "./utils";

const snapshotIsLive = (
    session: { lastPing: number; quit: boolean },
    now = Date.now(),
): boolean => {
    if (session.quit) return false;

    return now - session.lastPing <= PING_TIMEOUT_MS;
};

/**
 * @experimental
 * @description Host invoke for treaty presence procedures. Requires a live `senderId`. Breaking
 * changes may ship without a major version bump.
 */
export type PresenceProcedureProxy<TIO extends IORoom<any>> = (<
    TName extends Extract<keyof TIO["_defs"]["treaty"]["_defs"]["procedures"]["presence"], string>,
>(
    name: TName,
    data: InferTreatyProcedureInput<
        TIO["_defs"]["treaty"]["_defs"]["procedures"]["presence"][TName]
    >,
    senderId: string,
) => Promise<void>) & {
    [TName in Extract<keyof TIO["_defs"]["treaty"]["_defs"]["procedures"]["presence"], string>]: (
        data: InferTreatyProcedureInput<
            TIO["_defs"]["treaty"]["_defs"]["procedures"]["presence"][TName]
        >,
        senderId: string,
    ) => Promise<void>;
};

/**
 * @experimental
 * @description Host invoke for treaty storage procedures. Requires a live `senderId`. Breaking
 * changes may ship without a major version bump.
 */
export type StorageProcedureProxy<TIO extends IORoom<any>> = (<
    TName extends Extract<keyof TIO["_defs"]["treaty"]["_defs"]["procedures"]["storage"], string>,
>(
    name: TName,
    data: InferTreatyProcedureInput<
        TIO["_defs"]["treaty"]["_defs"]["procedures"]["storage"][TName]
    >,
    senderId: string,
) => Promise<void>) & {
    [TName in Extract<keyof TIO["_defs"]["treaty"]["_defs"]["procedures"]["storage"], string>]: (
        data: InferTreatyProcedureInput<
            TIO["_defs"]["treaty"]["_defs"]["procedures"]["storage"][TName]
        >,
        senderId: string,
    ) => Promise<void>;
};

export interface IORoomListeners<T extends IODefs = IODefs> {
    onRoomDestroyed: (event: IORoomDestroyedEvent<T>) => void;
    onStorageDestroyed: (event: IORoomListenerEvent<T>) => void;
    onMessage: (event: IORoomMessageEvent<T>) => void;
    onStorageUpdated: (event: IOStorageUpdatedEvent<T>) => MaybePromise<void>;
    onUserConnected: (event: IOUserConnectedEvent<T>) => void;
    onUserDisconnected: (event: IOUserDisconnectedEvent<T>) => void;
}

export type IORoomConfig<T extends IODefs = IODefs> = Partial<IORoomListeners<T>> & {
    context: PluvContext<T["platform"], T["context"]>;
    debug: boolean;
    getInitialStorage: GetInitialStorageFn<T["context"]>;
    limits: PluvIOLimits;
    platform: T["platform"];
    roomContext: InferRoomContextType<T["platform"]>;
    router: PluvRouter<T>;
    secret?: PluvIOSecret<T["platform"]>;
    treaty: T["treaty"];
};

type AuthorizedIdentity<TUser> =
    | { kind: "operator"; operator: OperatorUser; user: TUser }
    | { kind: "user"; operator: null; user: TUser };

/** Clients ignore `$storageUpdated` when `connectionId` is missing. A listener write has no session. */
const SERVER_STORAGE_CONNECTION_ID = "$server";

const effectFrame = <T extends IODefs>(
    type: string,
    data: unknown,
    session: Pick<RoomSessionSnapshot<T>, "id" | "operator" | "user">,
): RoomEffectFrame<T> => ({
    connectionId: session.id,
    data,
    operator: session.operator,
    type,
    user: session.user,
});

const framesFromRecord = <T extends IODefs>(
    record: Record<string, unknown> | null | undefined,
    session: Pick<RoomSessionSnapshot<T>, "id" | "operator" | "user">,
): RoomEffectFrame<T>[] => {
    if (!record) return [];

    return Object.entries(record).map(([type, data]) => effectFrame<T>(type, data, session));
};

export class IORoom<T extends IODefs = IODefs>
    implements IOLike<IOLikeFromDefs<T>>, SessionRoom<T>
{
    public readonly id: string;
    public readonly limits: PluvIOLimits;
    public readonly "~": IORoomInternal<T>;

    private _teardown: Promise<void> | null = null;
    private _uninitialize: Promise<() => Promise<void>> | null = null;

    private readonly _checkpoint: StorageCheckpoint<T["context"]>;
    private readonly _context: PluvContext<T["platform"], T["context"]>;
    private readonly _debug: boolean;
    private readonly _listeners: IORoomListeners<T>;
    private readonly _platform: T["platform"];
    private readonly _roomContext: InferRoomContextType<T["platform"]>;
    private readonly _router: PluvRouter<T>;
    private readonly _secret?: PluvIOSecret<T["platform"]>;
    private readonly _storage: RoomStorage<T>;
    private readonly _treaty: T["treaty"];

    /**
     * @ignore
     * @readonly
     * @deprecated Internal use only. Changes to this will never be marked as breaking.
     */
    public get _defs() {
        return {
            context: this._context,
            events: this._router._defs.events,
            platform: this._platform,
            treaty: this._treaty,
        } as {
            context: T["context"];
            events: T["events"];
            platform: T["platform"];
            treaty: T["treaty"];
        };
    }

    constructor(id: string, config: IORoomConfig<T>) {
        const {
            _meta,
            context,
            debug,
            getInitialStorage,
            limits,
            onRoomDestroyed,
            onStorageDestroyed,
            onStorageUpdated,
            onMessage,
            onUserConnected,
            onUserDisconnected,
            platform,
            roomContext,
            router,
            secret,
            treaty,
        } = config as IORoomConfig<T> & { _meta?: any };

        this.id = id;
        this.limits = limits;

        this._context = context;
        this._debug = debug;
        this._roomContext = roomContext;
        this._router = router;
        this._secret = secret;
        this._treaty = treaty;
        this._platform = platform.initialize({ ...(!!_meta ? { _meta } : {}), roomContext });
        this._storage = new RoomStorage({
            docFactory:
                (treaty.storage as AbstractCrdtDocFactory<any, any> | undefined) ?? noop.doc(),
            getContext: () => this._getContext(),
            getInitialStorage,
            platform: this._platform,
            room: this.id,
        });

        this._checkpoint = new StorageCheckpoint({
            getContext: () => this._getContext(),
            getDoc: () => this._doc,
            keepAlive: (promise) => {
                this._platform.keepAlive(promise);
            },
            limits: this.limits,
            onStored: (event) => {
                void this._listeners.onStorageUpdated(event);
            },
            room: this.id,
            setStorageState: (encodedState) =>
                this._platform.persistence.setStorageState(this.id, encodedState),
        });

        this._listeners = {
            onRoomDestroyed: (event) => onRoomDestroyed?.(event),
            onStorageDestroyed: (event) => onStorageDestroyed?.(event),
            onStorageUpdated: (event) => {
                // Already settled when the listener returns nothing. A returned promise
                // is kept until it settles. The checkpoint does not wait for it.
                this._platform.keepAlive(
                    Promise.resolve(onStorageUpdated?.(event)).catch((error: unknown) => {
                        console.error(error);
                    }),
                );
            },
            onMessage: (event) => {
                // Already settled when the listener returns nothing. A returned promise
                // is kept until it settles. The message handler does not wait for it.
                this._platform.keepAlive(
                    Promise.resolve(onMessage?.(event)).catch((error: unknown) => {
                        console.error(error);
                    }),
                );
            },
            onUserConnected: (event) => onUserConnected?.(event),
            onUserDisconnected: (event) => onUserDisconnected?.(event),
        };

        this["~"] = {
            applyPresencePatch: this._applyPresencePatch.bind(this),
            applyStorageProcedure: this._applyStorageProcedure.bind(this),
            close: this._close.bind(this),
            destroy: this._destroyRoom.bind(this),
            flushCheckpoint: async () => {
                const status = await this._checkpoint.flush();
                const updates = this._checkpoint.takeUpdates();

                return {
                    broadcast: updates.map((update): RoomEffectFrame<T> => ({
                        connectionId: SERVER_STORAGE_CONNECTION_ID,
                        data: { state: update },
                        operator: null,
                        type: "$storageUpdated",
                        user: null,
                    })),
                    status,
                };
            },
            garbageCollect: this._garbageCollect.bind(this),
            initializeStorage: this._initializeStorage.bind(this),
            logDebug: this._logDebug.bind(this),
            message: this._message.bind(this),
            register: this._register.bind(this),
            storageDirty: () => this._checkpoint.dirty,
            userConnected: this._userConnected.bind(this),
            whenReady: () => this._initialized,
        };

        this._initialize();
    }

    /**
     * @internal Opens the stored document and applies a treaty presence procedure.
     */
    private async _applyPresencePatch(params: {
        name: string;
        data: unknown;
        session: RoomPresenceSession<T>;
    }): Promise<JsonObject | null | UserTurn<JsonObject | null>> {
        const { name, data, session } = params;
        const procedures = this._treaty._defs.procedures.presence;

        if (!procedures || !Object.hasOwn(procedures, name)) {
            throw new Error(`Unknown presence procedure "${name}"`);
        }

        const procedure = procedures[name];
        const doc = await this._doc;
        const applied = procedure.apply(data, {
            user: session.user,
            operator: session.operator,
            presence: session.presence,
            doc,
        }) as JsonObject | null | PromiseLike<JsonObject | null>;

        if (isThenable(applied)) return userTurn(Promise.resolve(applied));

        return applied;
    }

    private async _applyStorageProcedure(params: {
        name: string;
        data: unknown;
        actor: RoomStorageActor<T>;
    }): Promise<RoomEffects<T>> {
        if (!(await this._initialized) || this._checkpoint.closed) {
            return this._releaseStorage(emptyRoomEffects<T>(), params.actor);
        }

        const { name, data, actor } = params;
        const procedures = this._treaty._defs.procedures.storage;

        if (!procedures || !Object.hasOwn(procedures, name)) {
            throw new Error(`Unknown storage procedure "${name}"`);
        }

        const procedure = procedures[name];
        const doc = await this._doc;

        const apply = (): void => {
            procedure.apply(data, {
                user: actor.user,
                operator: actor.operator,
                presence: actor.presence,
                doc,
            });
        };

        const update = this._checkpoint.hold(() =>
            doc.captureUpdate(() => {
                if (procedure.config.transact === false) {
                    apply();

                    return;
                }

                doc.transact(apply, actor.id);
            }),
        );

        if (!update) return this._releaseStorage(emptyRoomEffects<T>(), actor);

        this._checkpoint.assertSize(doc.getEncodedState());

        return this._releaseStorage(
            {
                ...emptyRoomEffects<T>(),
                broadcast: [effectFrame("$storageUpdated", { state: update }, actor)],
            },
            actor,
        );
    }

    private async _close(session: RoomSessionSnapshot<T>): Promise<RoomEffects<T>> {
        if (!(await this._initialized)) {
            return { ...emptyRoomEffects<T>(), connectionId: session.id };
        }

        await this._emitDisconnected(session);

        return this._releaseStorage(
            {
                ...emptyRoomEffects<T>(),
                broadcast: [
                    effectFrame(
                        "$exit",
                        {
                            operator: session.operator,
                            sessionId: session.id,
                            user: session.user,
                        },
                        session,
                    ),
                ],
                closes: [session.id],
            },
            session,
        );
    }

    private async _destroyRoom(): Promise<void> {
        if (!this._uninitialize) return;

        const uninitialize = (await this._uninitialize).bind(this);

        await uninitialize();
    }

    private get _doc(): Promise<CrdtDocLike<any, any>> {
        if (!this._uninitialize) return this._storage.doc;

        return this._uninitialize.then(() => this._storage.doc);
    }

    private async _emitDisconnected(session: RoomSessionSnapshot<T>): Promise<void> {
        try {
            const [doc, context] = await Promise.all([this._doc, this._getContext()]);
            const encodedState = doc.getEncodedState();

            await Promise.resolve(
                this._listeners.onUserDisconnected({
                    context,
                    encodedState,
                    kind: session.kind,
                    operator: session.operator,
                    room: this.id,
                    user: session.user,
                }),
            );
        } catch (error) {
            console.error(error);
        }
    }

    private async _garbageCollect(
        sessions: readonly RoomSessionSnapshot<T>[],
    ): Promise<RoomEffects<T>> {
        const now = Date.now();
        const quitters = sessions.filter((session) => !snapshotIsLive(session, now));
        const live = sessions.length - quitters.length;
        const broadcast: RoomEffectFrame<T>[] = [];
        const closes: string[] = [];

        for (const session of quitters) {
            // onUserDisconnected is user code and may touch storage, so run one
            // disconnect at a time. Overlapping storage calls fail on a Durable Object.
            // oxlint-disable-next-line eslint/no-await-in-loop
            await this._emitDisconnected(session);
            broadcast.push(
                ...this._releaseStorage(emptyRoomEffects<T>(), session).broadcast,
                effectFrame(
                    "$exit",
                    {
                        operator: session.operator,
                        sessionId: session.id,
                        user: session.user,
                    },
                    session,
                ),
            );
            closes.push(session.id);
        }

        return {
            ...emptyRoomEffects<T>(),
            broadcast,
            closes,
            destroy: quitters.length > 0 && live === 0,
            storageDirty: this._checkpoint.dirty,
        };
    }

    private async _getAuthorizedUser(
        token: Maybe<string>,
        options: WebSocketRegisterConfig<T["platform"]>,
    ): Promise<AuthorizedIdentity<InferTreatyUser<T["treaty"]>> | null> {
        const secret = resolveIOSecret(this._secret, options);

        if (!token) return null;

        if (!secret) throw new Error("`secret` was not provided");

        const payload = await authorize({
            platform: this._platform,
            secret,
        }).decode(token);

        if (!payload) {
            this._logDebug(colors.blue("Could not decode token:"));
            this._logDebug(token);

            return null;
        }

        if (payload.room !== this.id) {
            this._logDebug(colors.blue(`Token is not authorized for room ${this.id}:`));
            this._logDebug(colors.blue("Received:"), payload.room);
            this._logDebug(token);

            return null;
        }

        const user = parsePluvSchema(this._treaty.user, payload.user) as InferTreatyUser<
            T["treaty"]
        >;

        switch (payload.kind) {
            case "operator": {
                try {
                    const operator = parseOperatorUser(payload.operator);

                    return { kind: "operator", operator, user };
                } catch {
                    this._logDebug(`${colors.blue("Operator token fails validation:")} ${token}`);

                    return null;
                }
            }
            case "user": {
                try {
                    return { kind: "user", operator: null, user };
                } catch {
                    this._logDebug(`${colors.blue("Token fails validation:")} ${token}`);

                    return null;
                }
            }
            default:
                return assertExhaustive(payload.kind);
        }
    }

    /** User context for session procedures. `.config({ context })` runs here. */
    private async _getContext(): Promise<T["context"]> {
        const context = this._context as PluvContext<T["platform"], T["context"]>;

        if (typeof context === "function") {
            return await Promise.resolve(context(this._roomContext));
        }

        return await Promise.resolve(context);
    }

    private _getProcedure(message: {
        type: string;
    }):
        | (typeof this._router)["_defs"]["events"][keyof (typeof this._router)["_defs"]["events"]]
        | null {
        return (
            this._router._defs.events[
                message.type as keyof (typeof this._router)["_defs"]["events"]
            ] ?? null
        );
    }

    private _initialize() {
        const promise = (async () => {
            this._logDebug(colors.blue(`Initializing room: ${this.id}`));

            if (!!this._uninitialize) {
                const uninitialize = (await this._uninitialize).bind(this);
                await uninitialize();

                this._uninitialize = null;
            }

            await this._storage.initialize();
            this._checkpoint.reopen();
            this._checkpoint.attach(await this._storage.doc);

            const uninitialize = async (): Promise<void> => {
                if (this._teardown) return this._teardown;

                this._teardown = (async () => {
                    await this._checkpoint.seal();
                    this._checkpoint.detach();

                    const context = await this._getContext();
                    const { encodedState, refusedEmptyPersist, shouldDestroyStorage } =
                        await this._storage.destroy();

                    if (refusedEmptyPersist) {
                        this._logDebug(
                            colors.blue(
                                `Refusing to persist an unwritten document for room: ${this.id}`,
                            ),
                        );
                    }

                    await Promise.resolve(
                        this._listeners.onRoomDestroyed({
                            ...("_meta" in this._platform && !!this._platform._meta
                                ? { _meta: this._platform._meta }
                                : {}),
                            context,
                            room: this.id,
                        }),
                    );

                    if (shouldDestroyStorage) {
                        await Promise.resolve(
                            this._listeners.onStorageDestroyed({
                                ...("_meta" in this._platform && !!this._platform._meta
                                    ? { _meta: this._platform._meta }
                                    : {}),
                                context,
                                encodedState,
                                room: this.id,
                            }),
                        );
                        await this._platform.persistence.deleteStorageState(this.id);
                    }

                    this._uninitialize = null;
                })();

                try {
                    await this._teardown;
                } finally {
                    this._teardown = null;
                }
            };

            return { uninitialize };
        })();

        this._uninitialize = promise.then((result) => result.uninitialize);
    }

    private get _initialized(): Promise<boolean> {
        if (!this._uninitialize) return Promise.resolve(false);

        return this._uninitialize.then(() => true);
    }

    private async _initializeStorage(params: {
        input: { stateVector?: string | null; update?: string | null };
        actor: RoomJoinActor<T>;
    }): Promise<{
        changeKind: "unchanged" | "initialized" | "empty";
        state: string | null;
        storageDirty: boolean;
    }> {
        if (!(await this._initialized))
            return { changeKind: "empty", state: null, storageDirty: false };

        const { input } = params;
        const doc = await this._doc;
        const context = await this._getContext();
        const update = input.update ?? null;
        const stateVector = input.stateVector ?? null;
        const stateForClient = (encodedState: string): string => {
            if (!stateVector) return encodedState;

            return doc.encodeDiff(stateVector);
        };

        if (this._storage.storageSeeded) {
            return {
                changeKind: "unchanged",
                state: stateVector ? doc.encodeDiff(stateVector) : doc.getEncodedState(),
                storageDirty: this._checkpoint.dirty,
            };
        }

        if (update) {
            const encodedState = this._checkpoint.hold(() =>
                doc.applyEncodedState({ update }).getEncodedState(),
            );
            const storageSize = new TextEncoder().encode(encodedState).length;

            if (!!this.limits.storageMaxSize && storageSize > this.limits.storageMaxSize) {
                throw new Error("Storage has exceeded the size limit");
            }

            this._storage.storageSeeded = true;

            const epoch = this._checkpoint.epoch;
            const saved = await this._platform.persistence
                .setStorageState(this.id, encodedState)
                .then(() => true)
                .catch((error: unknown) => {
                    this._logDebug(error);

                    return false;
                });

            if (saved) {
                this._checkpoint.acknowledge(epoch);
                void this._listeners.onStorageUpdated({
                    context,
                    encodedState,
                    room: this.id,
                });
            }

            return {
                changeKind: "initialized",
                state: stateForClient(encodedState),
                storageDirty: this._checkpoint.dirty,
            };
        }

        const encodedState = doc.getEncodedState();

        return {
            changeKind: "empty",
            state: stateForClient(encodedState),
            storageDirty: this._checkpoint.dirty,
        };
    }

    private _logDebug(...data: unknown[]): void {
        if (this._debug) console.log(...data);
    }

    private async _message(
        session: RoomSessionSnapshot<T>,
        event: { data: unknown; type: string },
    ): Promise<RoomEffects<T> | UserTurn<RoomEffects<T>>> {
        if (!(await this._initialized)) return this._releaseStorage(emptyRoomEffects<T>(), session);

        const context = await this._getContext();

        void this._listeners.onMessage({
            ...("_meta" in this._platform && !!this._platform._meta
                ? { _meta: this._platform._meta }
                : {}),
            context,
            message: event as InferEventMessage<
                InferEventsOutput<T["events"]>,
                keyof InferEventsOutput<T["events"]>
            >,
            kind: session.kind,
            operator: session.operator,
            room: this.id,
            user: session.user,
        });

        const procedure = this._getProcedure(event);

        if (!procedure) {
            if (event.type.startsWith("$")) {
                return this._releaseStorage(emptyRoomEffects<T>(), session);
            }

            return this._releaseStorage(
                {
                    ...emptyRoomEffects<T>(),
                    broadcast: [effectFrame(event.type, event.data, session)],
                },
                session,
            );
        }

        let inputs: unknown;

        try {
            inputs = procedure.config.input
                ? parsePluvSchema(procedure.config.input, event.data)
                : event.data;
        } catch (error) {
            return this._releaseStorage({ ...emptyRoomEffects<T>(), error }, session);
        }

        const attachments: RoomAttachment[] = [];
        let presence = session.presence;
        const doc = await this._doc;
        const storageEvent = event.type === "$syncStorage" || event.type === "$updateStorage";

        if (storageEvent && this._checkpoint.closed) {
            return this._releaseStorage(emptyRoomEffects<T>(), session);
        }

        const wide = this._resolverContext({
            attachments,
            context,
            doc,
            getPresence: () => presence,
            session,
            setPresence: (value) => {
                presence = value;
            },
        });
        const resolverContext = storageEvent ? wide : this._userContext(wide);
        const finish = (
            broadcast: Record<string, unknown> | null | undefined,
            self: Record<string, unknown> | null | undefined,
        ): RoomEffects<T> =>
            this._releaseStorage(
                {
                    ...emptyRoomEffects<T>(),
                    attachments,
                    broadcast: framesFromRecord(broadcast, session),
                    self: framesFromRecord(self, session),
                },
                session,
            );
        const invoked = invokeProcedureResolvers({
            broadcast: () =>
                storageEvent
                    ? this._checkpoint.hold(() =>
                          procedure.config.broadcast?.(inputs, resolverContext),
                      )
                    : procedure.config.broadcast?.(inputs, resolverContext),
            self: () => procedure.config.self?.(inputs, resolverContext),
        });

        try {
            if (!invoked.ok) {
                return this._releaseStorage(
                    { ...emptyRoomEffects<T>(), attachments, error: invoked.error },
                    session,
                );
            }

            const { broadcast: broadcastResult, self: selfResult } = invoked;

            // The storage broadcast stays on this join. Other resolvers can await the
            // session manager, so this join must finish before those promises do.
            if (!storageEvent && (isThenable(broadcastResult) || isThenable(selfResult))) {
                return userTurn(
                    Promise.all([broadcastResult, selfResult])
                        .then(([broadcast, self]) =>
                            finish(
                                broadcast as Record<string, unknown> | null,
                                self as Record<string, unknown> | null,
                            ),
                        )
                        .catch((error: unknown) =>
                            this._releaseStorage(
                                {
                                    ...emptyRoomEffects<T>(),
                                    attachments,
                                    error,
                                },
                                session,
                            ),
                        ),
                );
            }

            const [broadcast, self] = await Promise.all([broadcastResult, selfResult]);

            return finish(
                broadcast as Record<string, unknown> | null,
                self as Record<string, unknown> | null,
            );
        } catch (error) {
            return this._releaseStorage({ ...emptyRoomEffects<T>(), attachments, error }, session);
        }
    }

    private async _register(
        ...options: keyof InferInitContextType<T["platform"]> extends never
            ? [{ token?: string }?]
            : [WebSocketRegisterConfig<T["platform"]>]
    ): Promise<RoomRegisterResult<T>> {
        const _options = (options[0] ?? {}) as WebSocketRegisterConfig<T["platform"]>;
        const { token: tokenOption, ...initRest } = _options as WebSocketRegisterConfig<
            T["platform"]
        > & { token?: string | null };
        const token = tokenOption ?? null;
        const registerConfig = {
            ...this._platform.normalizeInitContext(initRest as InferInitContextType<T["platform"]>),
            token,
        } as WebSocketRegisterConfig<T["platform"]>;

        if (this._teardown) await this._teardown;

        if (!(await this._initialized)) {
            this._initialize();
            await this._initialized;
        }

        const identity = await this._getAuthorizedUser(token, registerConfig);

        if (!identity) {
            this._logDebug(colors.blue("Authorization failed for connection"));

            return {
                encodedState: null,
                error: new Error("Not authorized"),
                kind: null,
                operator: null,
                user: null,
            };
        }

        const doc = await this._doc;
        const encodedState = doc.isEmpty() ? null : doc.getEncodedState();

        return {
            encodedState,
            error: null,
            kind: identity.kind,
            operator: identity.operator,
            user: identity.user,
        };
    }

    private _resolverContext(params: {
        attachments: RoomAttachment[];
        context: T["context"];
        doc: CrdtDocLike<any, any>;
        getPresence: () => JsonObject | null;
        session: RoomSessionSnapshot<T>;
        setPresence: (presence: JsonObject | null) => void;
    }): StorageEventContext<T> & SessionEventContext<T> & { context: T["context"] } {
        const { attachments, context, doc, getPresence, session, setPresence } = params;
        const storage = this._storage;
        const time = new Date().getTime();

        return {
            connectionId: session.id,
            context,
            doc,
            kind: session.kind,
            operator: session.operator,
            platform: this._platform,
            get presence() {
                return getPresence() as SessionEventContext<T>["presence"];
            },
            persistence: this._platform.persistence,
            set presence(presence) {
                const next = (presence ?? null) as JsonObject | null;

                setPresence(next);

                const attachment: RoomAttachment = {
                    presence: next,
                    seq: session.seq.presence,
                    sessionId: session.id,
                };
                const index = attachments.findIndex((item) => item.sessionId === session.id);

                if (index === -1) attachments.push(attachment);
                else attachments[index] = attachment;
            },
            room: this.id,
            session: {
                id: session.id,
                kind: session.kind,
                operator: session.operator,
                presence: session.presence,
                quit: session.quit,
                room: this.id,
                seq: session.seq,
                timers: { ping: session.lastPing },
                user: session.user,
            } as WebSocketSession<T>,
            sessions: [],
            get storageSeeded() {
                return storage.storageSeeded;
            },
            set storageSeeded(value: boolean) {
                storage.storageSeeded = value;
            },
            user: session.user,
            time,
        } as unknown as StorageEventContext<T> & SessionEventContext<T> & { context: T["context"] };
    }

    private _releaseStorage(
        effects: RoomEffects<T>,
        session: Pick<RoomSessionSnapshot<T>, "id" | "operator" | "user">,
    ): RoomEffects<T> {
        const updates = this._checkpoint.takeUpdates();
        const broadcast = updates.length
            ? [
                  ...effects.broadcast,
                  ...updates.map((update) =>
                      effectFrame("$storageUpdated", { state: update }, session),
                  ),
              ]
            : effects.broadcast;

        return {
            ...effects,
            broadcast,
            connectionId: session.id,
            storageDirty:
                this._checkpoint.dirty ||
                broadcast.some((frame) => frame.type === "$storageUpdated"),
        };
    }

    private async _userConnected(params: {
        id: string;
        encodedState: string | null;
        kind: ParticipantKind;
        operator: OperatorUser | null;
        user: InferTreatyUser<T["treaty"]>;
    }): Promise<RoomEffects<T>> {
        const { encodedState, id, kind, operator, user } = params;
        const context = await this._getContext();

        try {
            await Promise.resolve(
                this._listeners.onUserConnected({
                    context,
                    encodedState,
                    kind,
                    operator,
                    room: this.id,
                    user,
                }),
            );
        } catch (error) {
            console.error(error);
        }

        return this._releaseStorage(emptyRoomEffects<T>(), { id, operator, user });
    }

    private _userContext(
        event: SessionEventContext<T> & Pick<EventResolverContext<T>, "context" | "doc">,
    ): EventResolverContext<T> {
        return {
            connectionId: event.connectionId,
            context: event.context,
            doc: event.doc,
            kind: event.kind,
            operator: event.operator,
            get presence() {
                return event.presence;
            },
            set presence(value) {
                event.presence = value;
            },
            room: event.room,
            time: event.time,
            user: event.user,
        };
    }
}
