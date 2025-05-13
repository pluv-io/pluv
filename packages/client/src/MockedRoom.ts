import type { AbstractCrdtDocFactory, InferCrdtJson, InferStorage } from "@pluv/crdt";
import type {
    BroadcastProxy,
    CrdtDocLike,
    EventNotifierSubscriptionCallback,
    EventProxy,
    IOLike,
    Id,
    InferIOInput,
    InferIOOutput,
    JsonObject,
    MergeEvents,
    OtherNotifierSubscriptionCallback,
    OthersSubscriptionCallback,
    RoomLike,
    StorageProxy,
    StorageRootSubscriptionCallback,
    StorageSubscriptionCallback,
    SubscribeProxy,
    UpdateMyPresenceAction,
    UserInfo,
    WebSocketState,
} from "@pluv/types";
import { ConnectionState } from "@pluv/types";
import type { CrdtManagerOptions } from "./CrdtManager";
import { CrdtManager } from "./CrdtManager";
import { CrdtNotifier } from "./CrdtNotifier";
import { EventNotifier } from "./EventNotifier";
import { PluvProcedure } from "./PluvProcedure";
import type { PluvRouterEventConfig } from "./PluvRouter";
import { PluvRouter } from "./PluvRouter";
import type { StateNotifierSubjects, SubscriptionCallback } from "./StateNotifier";
import { StateNotifier } from "./StateNotifier";
import type { UsersManagerConfig } from "./UsersManager";
import { UsersManager } from "./UsersManager";
import { UsersNotifier } from "./UsersNotifier";
import { MAX_PRESENCE_SIZE_BYTES } from "./constants";
import type {
    EventResolver,
    EventResolverContext,
    InternalSubscriptions,
    PluvClientLimits,
    WebSocketConnection,
} from "./types";

export type MockedRoomEvents<TIO extends IOLike> = Partial<{
    [P in keyof InferIOInput<TIO>]: (data: Id<InferIOInput<TIO>[P]>) => Partial<InferIOOutput<TIO>>;
}>;

export type MockedRoomConfig<
    TIO extends IOLike,
    TPresence extends JsonObject,
    TCrdt extends AbstractCrdtDocFactory<any>,
    TEvents extends PluvRouterEventConfig<TIO, TPresence, InferStorage<TCrdt>>,
> = {
    events?: MockedRoomEvents<MergeEvents<TEvents, TIO>>;
    limits?: PluvClientLimits;
    router?: PluvRouter<TIO, TPresence, InferStorage<TCrdt>, TEvents>;
} & Pick<CrdtManagerOptions<TCrdt>, "initialStorage"> &
    Omit<UsersManagerConfig<TPresence>, "limits">;

export class MockedRoom<
    TIO extends IOLike,
    TPresence extends JsonObject,
    TCrdt extends AbstractCrdtDocFactory<any>,
    TEvents extends PluvRouterEventConfig<TIO, TPresence, InferStorage<TCrdt>>,
> implements RoomLike<TIO, TPresence, InferStorage<TCrdt>>
{
    public readonly id: string;

    private readonly _crdtManager: CrdtManager<TCrdt>;
    private readonly _crdtNotifier = new CrdtNotifier<InferStorage<TCrdt>>();
    private readonly _eventNotifier = new EventNotifier<MergeEvents<TEvents, TIO>>();
    private readonly _events?: MockedRoomEvents<MergeEvents<TEvents, TIO>>;
    private readonly _limits: PluvClientLimits;
    private readonly _usersNotifier = new UsersNotifier<TIO, TPresence>();
    private readonly _router: PluvRouter<TIO, TPresence, InferStorage<TCrdt>, TEvents>;
    private _state: WebSocketState<TIO> = {
        authorization: {
            token: null,
            user: null,
        },
        connection: {
            attempts: 0,
            count: 1,
            id: null,
            state: ConnectionState.Untouched,
        },
        webSocket: null,
    };
    private readonly _stateNotifier = new StateNotifier<TIO, TPresence>();
    private readonly _subscriptions: InternalSubscriptions = {
        observeCrdt: null,
    };
    private readonly _usersManager: UsersManager<TIO, TPresence>;

    constructor(room: string, options: MockedRoomConfig<TIO, TPresence, TCrdt, TEvents>) {
        const { events, initialPresence, initialStorage, limits, presence, router } = options;

        this.id = room;

        this._events = events;
        this._limits = {
            presenceMaxSize: MAX_PRESENCE_SIZE_BYTES,
            ...limits,
        };
        this._router =
            router ??
            (new PluvRouter({}) as PluvRouter<TIO, TPresence, InferStorage<TCrdt>, TEvents>);
        this._usersManager = new UsersManager<TIO, TPresence>({
            initialPresence,
            limits: this._limits,
            presence,
        });

        this._crdtManager = new CrdtManager<TCrdt>({
            initialStorage,
        });

        this._observeCrdt();
    }

    public get storageLoaded(): boolean {
        return true;
    }

    public broadcast = new Proxy(
        async <TEvent extends keyof InferIOInput<MergeEvents<TEvents, TIO>>>(
            event: TEvent,
            data: Id<InferIOInput<MergeEvents<TEvents, TIO>>[TEvent]>,
        ): Promise<void> => {
            if (!this._state.webSocket) return;
            if (this._state.connection.state !== ConnectionState.Open) return;

            const type = event.toString();

            const procedure = this._router._defs.events[type] as PluvProcedure<
                TIO,
                any,
                any,
                TPresence,
                InferStorage<TCrdt>
            > | null;

            if (!procedure?.config.broadcast) {
                this._simulateEvent(type as TEvent, data);

                return;
            }

            const myself = this._usersManager.myself;

            if (!myself) return;

            const parsed = procedure.config.input ? procedure.config.input.parse(data) : data;
            const context: EventResolverContext<TIO, TPresence, InferStorage<TCrdt>> = {
                doc: this._crdtManager.doc,
                others: this._usersManager.getOthers(),
                room: this.id,
                user: myself,
            };

            const output = await (
                procedure.config.broadcast as EventResolver<
                    TIO,
                    any,
                    any,
                    TPresence,
                    InferStorage<TCrdt>
                >
            )(parsed, context);

            Object.entries(output).forEach(([_type, _data]) => {
                this._simulateEvent(_type as TEvent, _data as any);
            });
        },
        {
            get(fn, prop) {
                return async (
                    data: Id<InferIOInput<MergeEvents<TEvents, TIO>>[any]>,
                ): Promise<void> => {
                    return await fn(prop, data);
                };
            },
        },
    ) as BroadcastProxy<TIO, TEvents>;

    public canRedo = (): boolean => {
        return !!this._crdtManager.doc.canRedo();
    };

    public canUndo = (): boolean => {
        return !!this._crdtManager.doc.canUndo();
    };

    public event = new Proxy(
        <TEvent extends keyof InferIOOutput<MergeEvents<TEvents, TIO>>>(
            event: TEvent,
            callback: EventNotifierSubscriptionCallback<MergeEvents<TEvents, TIO>, any>,
        ): (() => void) => this._eventNotifier.subscribe(event, callback),
        {
            get(fn, prop) {
                return (
                    callback: EventNotifierSubscriptionCallback<MergeEvents<TEvents, TIO>, any>,
                ): (() => void) => fn(prop as any, callback);
            },
        },
    ) as EventProxy<TIO, TEvents>;

    public getConnection = (): WebSocketConnection => {
        // Create a read-only clone of the connection state
        return Object.freeze(JSON.parse(JSON.stringify(this._state.connection)));
    };

    public getDoc(): CrdtDocLike<InferStorage<TCrdt>> {
        return this._crdtManager.doc;
    }

    public getMyPresence = (): TPresence => {
        return this._usersManager.myPresence;
    };

    public getMyself = (): Id<UserInfo<TIO, TPresence>> | null => {
        return this._usersManager.myself;
    };

    public getOther = (connectionId: string): Id<UserInfo<TIO, TPresence>> | null => {
        return this._usersManager.getOther(connectionId);
    };

    public getOthers = (): readonly Id<UserInfo<TIO, TPresence>>[] => {
        return this._usersManager.getOthers();
    };

    public getStorage = <TKey extends keyof InferStorage<TCrdt>>(
        type: TKey,
    ): InferStorage<TCrdt>[TKey] | null => {
        const sharedType = this._crdtManager.get(type);

        if (typeof sharedType === "undefined") return null;

        return sharedType;
    };

    public getStorageJson(): InferCrdtJson<InferStorage<TCrdt>> | null;
    public getStorageJson<TKey extends keyof InferStorage<TCrdt>>(
        type: TKey,
    ): InferCrdtJson<InferStorage<TCrdt>[TKey]> | null;
    public getStorageJson<TKey extends keyof InferStorage<TCrdt>>(type?: TKey) {
        if (this._state.connection.id === null) return null;

        if (typeof type === "undefined") return this._crdtManager.doc.toJson();

        return this._crdtManager.doc.toJson(type);
    }

    public other = (
        connectionId: string,
        callback: OtherNotifierSubscriptionCallback<TIO, TPresence>,
    ): (() => void) => {
        const clientId = this._usersManager.getClientId(connectionId);

        if (!clientId) return () => undefined;

        return this._usersNotifier.subscribeOther(clientId, callback);
    };

    public redo = (): void => {
        this._crdtManager.doc.redo();
    };

    public storage = new Proxy(
        <TKey extends keyof InferStorage<TCrdt>>(
            key: TKey,
            callback: StorageSubscriptionCallback<InferStorage<TCrdt>, TKey>,
        ): (() => void) => this._crdtNotifier.subscribe(key, callback),
        {
            get: (fn, prop) => {
                type _Storage = InferStorage<TCrdt>;

                if (!!prop) {
                    return (callback: StorageRootSubscriptionCallback<_Storage>) => {
                        return this._crdtNotifier.subcribeRoot(callback);
                    };
                }

                return (callback: StorageSubscriptionCallback<_Storage, keyof _Storage>) => {
                    return fn(prop as keyof InferStorage<TCrdt>, callback);
                };
            },
        },
    ) as StorageProxy<InferStorage<TCrdt>>;

    public storageRoot = (
        fn: (value: {
            [P in keyof InferStorage<TCrdt>]: InferCrdtJson<InferStorage<TCrdt>[P]>;
        }) => void,
    ): (() => void) => {
        return this._crdtNotifier.subcribeRoot(fn);
    };

    public subscribe = new Proxy(
        <TSubject extends keyof StateNotifierSubjects<TIO, TPresence>>(
            name: TSubject,
            callback: SubscriptionCallback<TIO, TPresence, TSubject>,
        ): (() => void) => {
            return this._stateNotifier.subscribe(name, callback);
        },
        {
            get: (fn, prop) => {
                if (prop === "connection") {
                    return (callback: SubscriptionCallback<TIO, TPresence, "connection">) => {
                        return fn("connection", callback);
                    };
                }

                if (prop === "myPresence") {
                    return (callback: SubscriptionCallback<TIO, TPresence, "my-presence">) => {
                        return fn("my-presence", callback);
                    };
                }

                if (prop === "myself") {
                    return (callback: SubscriptionCallback<TIO, TPresence, "myself">) => {
                        return fn("myself", callback);
                    };
                }

                if (prop === "others") {
                    return (callback: OthersSubscriptionCallback<TIO, TPresence>) => {
                        return this._usersNotifier.subscribeOthers(callback);
                    };
                }

                if (prop === "storageLoaded") {
                    return (callback: SubscriptionCallback<TIO, TPresence, "storage-loaded">) => {
                        return fn("storage-loaded", callback);
                    };
                }

                if (prop === "event") return this.event;
                if (prop === "storage") return this.storage;
            },
        },
    ) as SubscribeProxy<TIO, TPresence, InferStorage<TCrdt>, TEvents>;

    public transact = (fn: (storage: InferStorage<TCrdt>) => void, origin?: string): void => {
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

    public updateMyPresence = (presence: UpdateMyPresenceAction<TPresence>): void => {
        const newPresence =
            typeof presence === "function" ? presence(this.getMyPresence()) : presence;

        this._usersManager.updateMyPresence(newPresence);

        const myPresence = this._usersManager.myPresence;
        const myself = this._usersManager.myself ?? null;

        this._stateNotifier.subjects["my-presence"].next(myPresence);
        if (!!myself) this._stateNotifier.subjects["myself"].next(myself);
    };

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

                    return { ...acc, [prop]: serialized };
                },
                {} as {
                    [P in keyof InferStorage<TCrdt>]: InferCrdtJson<InferStorage<TCrdt>[P]>;
                },
            );

            this._crdtNotifier.rootSubject.next(storageRoot);
        });

        this._subscriptions.observeCrdt = unsubscribe;
    }

    private _simulateEvent<TEvent extends keyof InferIOInput<MergeEvents<TEvents, TIO>>>(
        event: TEvent,
        data: Id<InferIOInput<MergeEvents<TEvents, TIO>>[TEvent]>,
    ) {
        if (!this._events) return;

        const type = event.toString();
        const resolver = this._events[type as TEvent];

        if (!resolver) return;

        const result = resolver(data);

        Object.keys(result).forEach((type) => {
            const _type = type.toString() as keyof Partial<InferIOOutput<TIO>>;
            const data = result[_type] as any;

            if (!data) return;

            this._eventNotifier.subject(_type).next(data);
        });
    }
}
