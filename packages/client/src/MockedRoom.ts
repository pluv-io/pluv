import type { InferDoc, InferDocLike, InferJson, InferStorage } from "@pluv/crdt";
import type {
    BroadcastProxy,
    CrdtDocLike,
    EventNotifierSubscriptionCallback,
    EventProxy,
    Id,
    MergeEvents,
    ListUsersOptions,
    ListUsersResult,
    OtherSubscriptionCallback,
    OthersSubscriptionCallback,
    RoomError,
    RoomErrorSubscriptionCallback,
    RoomEventListenerMap,
    RoomLike,
    RoomStats,
    StateNotifierSubjects,
    StorageProxy,
    StorageRootSubscriptionCallback,
    StorageSubscriptionCallback,
    SubscribeProxy,
    SubscriptionCallback,
    UpdateMyPresenceAction,
    UserInfo,
    WebSocketConnection,
    WebSocketState,
} from "@pluv/types";
import { ConnectionState, StorageState } from "@pluv/types";
import { makeSubject, subscribe } from "wonka";
import type { ClientDefs } from "./ClientDefs";
import type { CrdtManagerOptions } from "./CrdtManager";
import { CrdtManager } from "./CrdtManager";
import { CrdtNotifier } from "./CrdtNotifier";
import { EventNotifier } from "./EventNotifier";
import { PluvProcedure } from "./PluvProcedure";
import { PluvRouter } from "./PluvRouter";
import { StateNotifier } from "./StateNotifier";
import type { UsersManagerConfig } from "./UsersManager";
import { UsersManager } from "./UsersManager";
import { UsersNotifier } from "./UsersNotifier";
import { MAX_PRESENCE_SIZE_BYTES } from "./constants";
import type {
    EventResolver,
    EventResolverContext,
    InferClientInput,
    InferClientOutput,
    InferClientPresence,
    InternalSubscriptions,
    PluvClientLimits,
} from "./types";
import { parsePluvSchema } from "./utils";

export type MockedRoomEvents<TDefs extends ClientDefs = ClientDefs> = Partial<{
    [P in keyof InferClientInput<TDefs>]: (
        data: Id<InferClientInput<TDefs>[P]>,
    ) => Partial<InferClientOutput<TDefs>>;
}>;

export type MockedRoomConfig<TDefs extends ClientDefs = ClientDefs> = {
    events?: MockedRoomEvents<TDefs>;
    limits?: PluvClientLimits;
    router?: PluvRouter<TDefs>;
} & Pick<CrdtManagerOptions<TDefs["storage"]>, "initialStorage" | "storage"> &
    Omit<UsersManagerConfig<InferClientPresence<TDefs>>, "limits">;

export class MockedRoom<TDefs extends ClientDefs = ClientDefs> implements RoomLike<
    TDefs["io"],
    InferDoc<TDefs["storage"]>,
    InferClientPresence<TDefs>,
    InferStorage<TDefs["storage"]>,
    TDefs["events"],
    InferJson<TDefs["storage"]>
> {
    public readonly id: string;

    private readonly _crdtManager: CrdtManager<TDefs["storage"]>;
    private readonly _crdtNotifier = new CrdtNotifier<InferJson<TDefs["storage"]>>();
    private readonly _eventNotifier = new EventNotifier<
        MergeEvents<TDefs["events"], TDefs["io"]>
    >();
    private readonly _errorSubject = makeSubject<RoomError>();
    private readonly _events?: MockedRoomEvents<TDefs>;
    private readonly _limits: PluvClientLimits;
    private readonly _usersNotifier = new UsersNotifier<TDefs["io"], InferClientPresence<TDefs>>();
    private readonly _router: PluvRouter<TDefs>;
    private _state: WebSocketState<TDefs["io"]> = {
        authorization: {
            token: null,
            user: null,
        },
        connection: {
            attempts: 0,
            id: null,
            state: ConnectionState.Untouched,
        },
        storage: {
            state: StorageState.Unavailable,
        },
        webSocket: null,
    };
    private readonly _stateNotifier = new StateNotifier<TDefs["io"], InferClientPresence<TDefs>>();
    private readonly _subscriptions: InternalSubscriptions = {
        observeCrdt: null,
    };
    private readonly _usersManager: UsersManager<TDefs["io"], InferClientPresence<TDefs>>;

    constructor(room: string, options: MockedRoomConfig<TDefs>) {
        const { events, initialPresence, initialStorage, limits, presence, router, storage } =
            options;

        this.id = room;

        this._events = events;
        this._limits = {
            presenceMaxSize: MAX_PRESENCE_SIZE_BYTES,
            ...limits,
        };
        this._router = router ?? (new PluvRouter({}) as PluvRouter<TDefs>);
        this._usersManager = new UsersManager<TDefs["io"], InferClientPresence<TDefs>>({
            initialPresence,
            limits: this._limits,
            presence,
        });
        this._publishRoomStats();

        this._crdtManager = new CrdtManager<TDefs["storage"]>({
            initialStorage,
            storage,
        });

        this._observeCrdt();
    }

    public addEventListener<TKind extends keyof RoomEventListenerMap>(
        kind: TKind,
        handler: RoomEventListenerMap[TKind],
    ): () => void {
        return () => undefined;
    }

    public broadcast = new Proxy(
        async <TEvent extends keyof InferClientInput<TDefs>>(
            event: TEvent,
            data: Id<InferClientInput<TDefs>[TEvent]>,
        ): Promise<void> => {
            if (!this._state.webSocket) return;
            if (this._state.connection.state !== ConnectionState.Open) return;

            const type = event.toString();

            const procedure = this._router._defs.events[type] as PluvProcedure<TDefs> | null;

            if (!procedure?.config.broadcast) {
                this._simulateEvent(type as TEvent, data);

                return;
            }

            const myself = this._usersManager.myself;

            if (!myself) return;

            const parsed = procedure.config.input
                ? parsePluvSchema(procedure.config.input, data)
                : data;
            const context: EventResolverContext<
                TDefs["io"],
                InferClientPresence<TDefs>,
                InferDocLike<TDefs["storage"]>
            > = {
                doc: this._crdtManager.doc,
                others: this._usersManager.getOthers(),
                room: this.id,
                user: myself,
            };

            const output = await (
                procedure.config.broadcast as EventResolver<
                    TDefs["io"],
                    any,
                    any,
                    InferClientPresence<TDefs>,
                    InferDocLike<TDefs["storage"]>
                >
            )(parsed, context);

            Object.entries(output).forEach(([_type, _data]) => {
                this._simulateEvent(_type as TEvent, _data as any);
            });
        },
        {
            get(fn, prop) {
                return async (data: Id<InferClientInput<TDefs>[any]>): Promise<void> => {
                    return await fn(prop, data);
                };
            },
        },
    ) as BroadcastProxy<TDefs["io"], TDefs["events"]>;

    public canRedo = (): boolean => {
        return this._crdtManager.doc.canRedo();
    };

    public canUndo = (): boolean => {
        return this._crdtManager.doc.canUndo();
    };

    public getConnection = (): WebSocketConnection => {
        // Create a read-only clone of the connection state
        return Object.freeze(JSON.parse(JSON.stringify(this._state.connection)));
    };

    public getDoc(): CrdtDocLike<
        InferDoc<TDefs["storage"]>,
        InferStorage<TDefs["storage"]>,
        InferJson<TDefs["storage"]>
    > {
        return this._crdtManager.doc;
    }

    public getMyPresence = (): InferClientPresence<TDefs> => {
        return this._usersManager.myPresence;
    };

    public getMyself = (): Id<UserInfo<TDefs["io"], InferClientPresence<TDefs>>> | null => {
        return this._usersManager.myself;
    };

    public getOther = (
        userId: string,
    ): Id<UserInfo<TDefs["io"], InferClientPresence<TDefs>>> | null => {
        return this._usersManager.getOther(userId);
    };

    public getOtherByConnectionId = (
        connectionId: string,
    ): Id<UserInfo<TDefs["io"], InferClientPresence<TDefs>>> | null => {
        return this._usersManager.getOtherByConnectionId(connectionId);
    };

    public getOthers = (): readonly Id<UserInfo<TDefs["io"], InferClientPresence<TDefs>>>[] => {
        return this._usersManager.getOthers();
    };

    /**
     * Occupancy of mocked people currently tracked in this room. Empty until
     * occupants exist (`setMyself` / extra connections); MockedRoomProvider
     * does not seed them.
     */
    public getRoomStats = (): RoomStats => {
        return this._usersManager.getOccupancy();
    };

    public getStorage = <TKey extends keyof InferStorage<TDefs["storage"]>>(
        type: TKey,
    ): InferStorage<TDefs["storage"]>[TKey] | null => {
        const sharedType = this._crdtManager.get(type);

        if (typeof sharedType === "undefined") return null;

        return sharedType;
    };

    public getStorageJson(): InferJson<TDefs["storage"]> | null;
    public getStorageJson<TKey extends keyof InferJson<TDefs["storage"]>>(
        type: TKey,
    ): InferJson<TDefs["storage"]>[TKey] | null;
    public getStorageJson<TKey extends keyof InferJson<TDefs["storage"]>>(type?: TKey) {
        if (this._state.connection.id === null) return null;
        if (typeof type === "undefined") return this._crdtManager.doc.toJson();

        return this._crdtManager.doc.toJson(type);
    }

    public getStorageLoaded(): boolean {
        return true;
    }

    /**
     * Identity page of mocked people currently tracked in this room. Empty until
     * occupants exist; MockedRoomProvider does not seed them. Not a real
     * listUsers protocol (no limit/cursor).
     */
    public listUsers = (_options: ListUsersOptions = {}): Promise<ListUsersResult<TDefs["io"]>> => {
        const myself = this._usersManager.myself;
        const users = [
            ...(myself ? [{ data: myself.data }] : []),
            ...this._usersManager.getOthers().map((other) => ({ data: other.data })),
        ].toSorted((left, right) => {
            const a = String(left.data.id);
            const b = String(right.data.id);

            if (a < b) return -1;
            if (a > b) return 1;

            return 0;
        });
        const last = users.at(-1);

        return Promise.resolve({
            success: true,
            pageInfo: { endCursor: last ? String(last.data.id) : null, hasNextPage: false },
            users,
        });
    };

    public redo = (): void => {
        this._crdtManager.doc.redo();
    };

    public storageRoot = (fn: (value: InferJson<TDefs["storage"]>) => void): (() => void) => {
        return this._crdtNotifier.subcribeRoot(fn);
    };

    public subscribe = new Proxy(
        <TSubject extends keyof StateNotifierSubjects<TDefs["io"], InferClientPresence<TDefs>>>(
            name: TSubject,
            callback: SubscriptionCallback<TDefs["io"], InferClientPresence<TDefs>, TSubject>,
        ): (() => void) => {
            return this._stateNotifier.subscribe(name, callback);
        },
        {
            get: (fn, prop) => {
                if (prop === "connection") {
                    return (
                        callback: SubscriptionCallback<
                            TDefs["io"],
                            InferClientPresence<TDefs>,
                            "connection"
                        >,
                    ) => {
                        return fn("connection", callback);
                    };
                }

                if (prop === "error") {
                    return (callback: RoomErrorSubscriptionCallback): (() => void) => {
                        return subscribe(callback)(this._errorSubject.source).unsubscribe;
                    };
                }

                if (prop === "myPresence") {
                    return (
                        callback: SubscriptionCallback<
                            TDefs["io"],
                            InferClientPresence<TDefs>,
                            "my-presence"
                        >,
                    ) => {
                        return fn("my-presence", callback);
                    };
                }

                if (prop === "myself") {
                    return (
                        callback: SubscriptionCallback<
                            TDefs["io"],
                            InferClientPresence<TDefs>,
                            "myself"
                        >,
                    ) => {
                        return fn("myself", callback);
                    };
                }

                if (prop === "others") {
                    return (
                        callback: OthersSubscriptionCallback<
                            TDefs["io"],
                            InferClientPresence<TDefs>
                        >,
                    ) => {
                        return this._usersNotifier.subscribeOthers(callback);
                    };
                }

                if (prop === "roomStats") {
                    return (
                        callback: SubscriptionCallback<
                            TDefs["io"],
                            InferClientPresence<TDefs>,
                            "roomStats"
                        >,
                    ) => {
                        return fn("roomStats", callback);
                    };
                }

                if (prop === "storageLoaded") {
                    return (
                        callback: SubscriptionCallback<
                            TDefs["io"],
                            InferClientPresence<TDefs>,
                            "storage-loaded"
                        >,
                    ) => {
                        return fn("storage-loaded", callback);
                    };
                }

                if (prop === "event") return this._event;
                if (prop === "other") return this._other;
                if (prop === "storage") return this.#_storage;

                throw new Error(`Unknown subscription: ${String(prop)}`);
            },
        },
    ) as SubscribeProxy<
        TDefs["io"],
        InferClientPresence<TDefs>,
        InferJson<TDefs["storage"]>,
        TDefs["events"]
    >;

    public transact = (
        fn: (storage: InferStorage<TDefs["storage"]>) => void,
        origin?: string,
    ): void => {
        const _origin = origin ?? this._state.connection.id;
        const crdtManager = this._crdtManager;

        /**
         * !HACK
         * @description Don't transact anything if there is no origin, because
         * that means the user isn't connected yet. This will mean events are
         * lost unfortunately.
         * @date September 23, 2023
         */
        if (typeof _origin !== "string") return;
        if (!crdtManager) return;

        crdtManager.doc.transact(() => {
            const storage = crdtManager.doc.get();

            fn(storage);
        }, _origin);
    };

    public undo = (): void => {
        this._crdtManager.doc.undo();
    };

    public updateMyPresence = (
        presence: UpdateMyPresenceAction<InferClientPresence<TDefs>>,
    ): void => {
        const newPresence =
            typeof presence === "function" ? presence(this.getMyPresence()) : presence;

        this._usersManager.updateMyPresence(newPresence);

        const myPresence = this._usersManager.myPresence;
        const myself = this._usersManager.myself ?? null;

        this._stateNotifier.subjects["my-presence"].next(myPresence);
        if (!!myself) this._stateNotifier.subjects["myself"].next(myself);
    };

    private _event = new Proxy(
        // oxlint-disable-next-line typescript/no-unnecessary-type-parameters
        <TEvent extends keyof InferClientOutput<TDefs>>(
            event: TEvent,
            callback: EventNotifierSubscriptionCallback<
                MergeEvents<TDefs["events"], TDefs["io"]>,
                any
            >,
        ): (() => void) => this._eventNotifier.subscribe(event, callback),
        {
            get(fn, prop) {
                return (
                    callback: EventNotifierSubscriptionCallback<
                        MergeEvents<TDefs["events"], TDefs["io"]>,
                        any
                    >,
                ): (() => void) => fn(prop as any, callback);
            },
        },
    ) as EventProxy<TDefs["io"], TDefs["events"]>;

    private _observeCrdt(): void {
        this._subscriptions.observeCrdt?.();

        if (!this._crdtManager) return;

        const unsubscribe = this._crdtManager.doc.subscribe((event) => {
            const origin = event.origin ?? null;

            if (!this._crdtManager) return;
            if (origin === "$storageUpdated") return;

            const sharedTypes = this._crdtManager.doc.get();

            const storageRoot = Object.keys(sharedTypes).reduce(
                (acc, prop) => {
                    if (!this._crdtManager) return acc;

                    const serialized = this._crdtManager.doc.toJson(prop);

                    this._crdtNotifier.subject(prop).next(serialized);

                    acc[prop as keyof InferStorage<TDefs["storage"]>] = serialized;

                    return acc;
                },
                {} as InferJson<TDefs["storage"]>,
            );

            this._crdtNotifier.rootSubject.next(storageRoot);
        });

        this._subscriptions.observeCrdt = unsubscribe;
    }

    private _publishRoomStats(): void {
        this._stateNotifier.subjects.roomStats.next(this._usersManager.getOccupancy());
    }

    private _other = (
        userId: string,
        callback: OtherSubscriptionCallback<TDefs["io"], InferClientPresence<TDefs>>,
    ): (() => void) => {
        return this._usersNotifier.subscribeOther(userId, callback);
    };

    private _simulateEvent<TEvent extends keyof InferClientInput<TDefs>>(
        event: TEvent,
        data: Id<InferClientInput<TDefs>[TEvent]>,
    ) {
        if (!this._events) return;

        const type = event.toString();
        const resolver = this._events[type as TEvent];

        if (!resolver) return;

        const result = resolver(data);

        Object.keys(result).forEach((outputType) => {
            const _type = outputType as keyof Partial<InferClientOutput<TDefs>>;
            const outputData = result[_type] as any;

            if (!outputData) return;

            this._eventNotifier.subject(_type).next(outputData);
        });
    }

    #_storage = new Proxy(
        <TKey extends keyof InferJson<TDefs["storage"]>>(
            key: TKey,
            callback: StorageSubscriptionCallback<InferJson<TDefs["storage"]>, TKey>,
        ): (() => void) => this._crdtNotifier.subscribe(key, callback),
        {
            get: (fn, prop) => {
                type _Json = InferJson<TDefs["storage"]>;

                if (!!prop) {
                    return (callback: StorageRootSubscriptionCallback<_Json>) => {
                        return this._crdtNotifier.subcribeRoot(callback);
                    };
                }

                return (callback: StorageSubscriptionCallback<_Json, keyof _Json>) => {
                    return fn(prop as keyof InferJson<TDefs["storage"]>, callback);
                };
            },
        },
    ) as StorageProxy<InferJson<TDefs["storage"]>>;
}
