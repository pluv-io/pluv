import type { AbstractCrdtDoc, CrdtType, InferCrdtJson } from "@pluv/crdt";
import type { IOLike, Id, InferIOInput, InferIOOutput, JsonObject } from "@pluv/types";
import { AbstractRoom } from "./AbstractRoom";
import type { CrdtManagerOptions } from "./CrdtManager";
import { CrdtManager } from "./CrdtManager";
import { CrdtNotifier } from "./CrdtNotifier";
import type { EventNotifierSubscriptionCallback } from "./EventNotifier";
import { EventNotifier } from "./EventNotifier";
import type { OtherNotifierSubscriptionCallback } from "./OtherNotifier";
import { OtherNotifier } from "./OtherNotifier";
import { PluvProcedure } from "./PluvProcedure";
import type { MergeEvents, PluvRouterEventConfig } from "./PluvRouter";
import { PluvRouter } from "./PluvRouter";
import type { StateNotifierSubjects, SubscriptionCallback } from "./StateNotifier";
import { StateNotifier } from "./StateNotifier";
import type { UsersManagerConfig } from "./UsersManager";
import { UsersManager } from "./UsersManager";
import { ConnectionState } from "./enums";
import type {
    EventResolver,
    EventResolverContext,
    InternalSubscriptions,
    PluvClientLimits,
    UpdateMyPresenceAction,
    UserInfo,
    WebSocketConnection,
    WebSocketState,
} from "./types";
import { MAX_PRESENCE_SIZE_BYTES } from "./constants";

export type MockedRoomEvents<TIO extends IOLike> = Partial<{
    [P in keyof InferIOInput<TIO>]: (data: Id<InferIOInput<TIO>[P]>) => Partial<InferIOOutput<TIO>>;
}>;

export type MockedRoomConfig<
    TIO extends IOLike,
    TPresence extends JsonObject = {},
    TStorage extends Record<string, CrdtType<any, any>> = {},
    TEvents extends PluvRouterEventConfig<TIO, TPresence, TStorage> = {},
> = {
    events?: MockedRoomEvents<MergeEvents<TEvents, TIO>>;
    limits?: PluvClientLimits;
    router?: PluvRouter<TIO, TPresence, TStorage, TEvents>;
} & Pick<CrdtManagerOptions<TStorage>, "initialStorage"> &
    Omit<UsersManagerConfig<TPresence>, "limits">;

export class MockedRoom<
    TIO extends IOLike,
    TPresence extends JsonObject = {},
    TStorage extends Record<string, CrdtType<any, any>> = {},
    TEvents extends PluvRouterEventConfig<TIO, TPresence, TStorage> = {},
> extends AbstractRoom<TIO, TPresence, TStorage> {
    private readonly _crdtManager: CrdtManager<TStorage>;
    private readonly _crdtNotifier = new CrdtNotifier<TStorage>();
    private readonly _eventNotifier = new EventNotifier<MergeEvents<TEvents, TIO>>();
    private readonly _events?: MockedRoomEvents<MergeEvents<TEvents, TIO>>;
    private readonly _limits: PluvClientLimits;
    private readonly _otherNotifier = new OtherNotifier<TIO, TPresence>();
    private readonly _router: PluvRouter<TIO, TPresence, TStorage, TEvents>;
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

    constructor(room: string, options: MockedRoomConfig<TIO, TPresence, TStorage, TEvents>) {
        const { events, initialPresence, initialStorage, limits, presence, router } = options;

        super(room);

        this._events = events;
        this._limits = {
            presenceMaxSize: MAX_PRESENCE_SIZE_BYTES,
            ...limits,
        };
        this._router = router ?? (new PluvRouter({}) as PluvRouter<TIO, TPresence, TStorage, TEvents>);
        this._usersManager = new UsersManager<TIO, TPresence>({ initialPresence, limits: this._limits, presence });

        this._crdtManager = new CrdtManager<TStorage>({
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
                TStorage
            > | null;

            if (!procedure?.config.broadcast) {
                this._simulateEvent(type as TEvent, data);

                return;
            }

            const myself = this._usersManager.myself;

            if (!myself) return;

            const parsed = procedure.config.input ? procedure.config.input.parse(data) : data;
            const context: EventResolverContext<TIO, TPresence, TStorage> = {
                doc: this._crdtManager.doc,
                others: this._usersManager.getOthers(),
                room: this.id,
                user: myself,
            };

            const output = await (procedure.config.broadcast as EventResolver<TIO, any, any, TPresence, TStorage>)(
                parsed,
                context,
            );

            Object.entries(output).forEach(([_type, _data]) => {
                this._simulateEvent(_type as TEvent, _data as any);
            });
        },
        {
            get(fn, prop) {
                return async (data: Id<InferIOInput<MergeEvents<TEvents, TIO>>[any]>): Promise<void> => {
                    return await fn(prop, data);
                };
            },
        },
    ) as (<TEvent extends keyof InferIOInput<MergeEvents<TEvents, TIO>>>(
        event: TEvent,
        data: Id<InferIOInput<MergeEvents<TEvents, TIO>>[TEvent]>,
    ) => Promise<void>) & {
        [event in keyof InferIOInput<TIO>]: (data: Id<InferIOInput<TIO>[event]>) => Promise<void>;
    };

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
                return (callback: EventNotifierSubscriptionCallback<MergeEvents<TEvents, TIO>, any>): (() => void) =>
                    fn(prop as any, callback);
            },
        },
    ) as (<TEvent extends keyof InferIOOutput<MergeEvents<TEvents, TIO>>>(
        event: TEvent,
        callback: EventNotifierSubscriptionCallback<MergeEvents<TEvents, TIO>, TEvent>,
    ) => () => void) & {
        [event in keyof InferIOOutput<MergeEvents<TEvents, TIO>>]: (
            callback: EventNotifierSubscriptionCallback<MergeEvents<TEvents, TIO>, any>,
        ) => () => void;
    };

    public getConnection = (): WebSocketConnection => {
        // Create a read-only clone of the connection state
        return Object.freeze(JSON.parse(JSON.stringify(this._state.connection)));
    };

    public getDoc(): AbstractCrdtDoc<TStorage> {
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

    public getStorage = <TKey extends keyof TStorage>(type: TKey): TStorage[TKey] | null => {
        const sharedType = this._crdtManager.get(type);

        if (typeof sharedType === "undefined") return null;

        return sharedType;
    };

    public getStorageJson(): InferCrdtJson<TStorage> | null;
    public getStorageJson<TKey extends keyof TStorage>(type: TKey): InferCrdtJson<TStorage[TKey]> | null;
    public getStorageJson<TKey extends keyof TStorage>(type?: TKey) {
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

        return this._otherNotifier.subscribe(clientId, callback);
    };

    public redo = (): void => {
        this._crdtManager.doc.redo();
    };

    public storage = <TKey extends keyof TStorage>(
        key: TKey,
        fn: (value: InferCrdtJson<TStorage[TKey]>) => void,
    ): (() => void) => {
        return this._crdtNotifier.subscribe(key, fn);
    };

    public storageRoot = (
        fn: (value: {
            [P in keyof TStorage]: InferCrdtJson<TStorage[P]>;
        }) => void,
    ): (() => void) => {
        return this._crdtNotifier.subcribeRoot(fn);
    };

    public subscribe = <TSubject extends keyof StateNotifierSubjects<TIO, TPresence>>(
        name: TSubject,
        callback: SubscriptionCallback<TIO, TPresence, TSubject>,
    ): (() => void) => {
        return this._stateNotifier.subscribe(name, callback);
    };

    public transact = (fn: (storage: TStorage) => void, origin?: string): void => {
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
        const newPresence = typeof presence === "function" ? presence(this.getMyPresence()) : presence;

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
                    [P in keyof TStorage]: InferCrdtJson<TStorage[P]>;
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
