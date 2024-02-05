import type {
    AbstractCrdtDoc,
    AbstractCrdtType,
    InferCrdtStorageJson,
} from "@pluv/crdt";
import type {
    IOLike,
    Id,
    InferIOInput,
    InferIOOutput,
    JsonObject,
} from "@pluv/types";
import { AbstractRoom } from "./AbstractRoom";
import type { CrdtManagerOptions } from "./CrdtManager";
import { CrdtManager } from "./CrdtManager";
import { CrdtNotifier } from "./CrdtNotifier";
import type { EventNotifierSubscriptionCallback } from "./EventNotifier";
import { EventNotifier } from "./EventNotifier";
import type { OtherNotifierSubscriptionCallback } from "./OtherNotifier";
import { OtherNotifier } from "./OtherNotifier";
import type {
    StateNotifierSubjects,
    SubscriptionCallback,
} from "./StateNotifier";
import { StateNotifier } from "./StateNotifier";
import type { UsersManagerConfig } from "./UsersManager";
import { UsersManager } from "./UsersManager";
import type {
    InternalSubscriptions,
    UserInfo,
    WebSocketConnection,
    WebSocketState,
} from "./types";
import { ConnectionState } from "./types";

export type MockedRoomEvents<TIO extends IOLike> = Partial<{
    [P in keyof InferIOInput<TIO>]: (
        data: Id<InferIOInput<TIO>[P]>,
    ) => Partial<InferIOOutput<TIO>>;
}>;

export type MockedRoomConfig<
    TIO extends IOLike,
    TPresence extends JsonObject = {},
    TStorage extends Record<string, AbstractCrdtType<any, any>> = {},
> = { events?: MockedRoomEvents<TIO> } & Omit<
    CrdtManagerOptions<TStorage>,
    "encodedState"
> &
    UsersManagerConfig<TPresence>;

export class MockedRoom<
    TIO extends IOLike,
    TPresence extends JsonObject = {},
    TStorage extends Record<string, AbstractCrdtType<any, any>> = {},
> extends AbstractRoom<TIO, TPresence, TStorage> {
    private _crdtManager: CrdtManager<TStorage>;
    private _crdtNotifier = new CrdtNotifier<TStorage>();
    private _eventNotifier = new EventNotifier<TIO>();
    private _events?: MockedRoomEvents<TIO>;
    private _otherNotifier = new OtherNotifier<TIO>();
    private _state: WebSocketState<TIO> = {
        authorization: {
            token: null,
            user: null,
        },
        connection: {
            count: 1,
            id: null,
            state: ConnectionState.Untouched,
        },
        webSocket: null,
    };
    private _stateNotifier = new StateNotifier<TIO, TPresence>();
    private _subscriptions: InternalSubscriptions = {
        observeCrdt: null,
    };
    private _usersManager: UsersManager<TIO, TPresence>;

    constructor(
        room: string,
        options: MockedRoomConfig<TIO, TPresence, TStorage>,
    ) {
        const { events, initialPresence, initialStorage, presence } = options;

        super(room);

        this._events = events;

        this._usersManager = new UsersManager<TIO, TPresence>({
            initialPresence,
            presence,
        });

        this._crdtManager = new CrdtManager<TStorage>({
            initialStorage,
        });

        this._observeCrdt();
    }

    public broadcast<TEvent extends keyof InferIOInput<TIO>>(
        event: TEvent,
        data: Id<InferIOInput<TIO>[TEvent]>,
    ): void {
        if (!this._events) return;

        const resolver = this._events[event];

        if (!resolver) return;

        const result = resolver(data);

        Object.keys(result).forEach((type) => {
            const _type = type.toString() as keyof Partial<InferIOOutput<TIO>>;
            const data = result[_type] as any;

            if (!data) return;

            this._eventNotifier.subject(_type).next(data);
        });
    }

    public canRedo = (): boolean => {
        return !!this._crdtManager.doc.canRedo();
    };

    public canUndo = (): boolean => {
        return !!this._crdtManager.doc.canUndo();
    };

    public event = <TEvent extends keyof InferIOOutput<TIO>>(
        event: TEvent,
        callback: EventNotifierSubscriptionCallback<TIO, TEvent>,
    ): (() => void) => {
        return this._eventNotifier.subscribe(event, callback);
    };

    public getConnection(): WebSocketConnection {
        // Create a read-only clone of the connection state
        return Object.freeze(
            JSON.parse(JSON.stringify(this._state.connection)),
        );
    }

    public getDoc(): AbstractCrdtDoc<TStorage> {
        return this._crdtManager.doc;
    }

    public getMyPresence = (): TPresence => {
        return this._usersManager.myPresence;
    };

    public getMyself = (): Id<UserInfo<TIO, TPresence>> | null => {
        return this._usersManager.myself;
    };

    public getOther = (
        connectionId: string,
    ): Id<UserInfo<TIO, TPresence>> | null => {
        return this._usersManager.getOther(connectionId);
    };

    public getOthers = (): readonly Id<UserInfo<TIO, TPresence>>[] => {
        return this._usersManager.getOthers();
    };

    public getStorage = <TKey extends keyof TStorage>(
        key: TKey,
    ): TStorage[TKey] => {
        const sharedType = this._crdtManager.get(key);

        if (typeof sharedType === "undefined") {
            throw new Error(`Could not find storege: ${key.toString()}`);
        }

        return sharedType.value;
    };

    public other = (
        connectionId: string,
        callback: OtherNotifierSubscriptionCallback<TIO>,
    ): (() => void) => {
        return this._otherNotifier.subscribe(connectionId, callback);
    };

    public redo = (): void => {
        this._crdtManager.doc.redo();
    };

    public storage = <TKey extends keyof TStorage>(
        key: TKey,
        fn: (value: InferCrdtStorageJson<TStorage[TKey]>) => void,
    ): (() => void) => {
        return this._crdtNotifier.subscribe(key, fn);
    };

    public storageRoot = (
        fn: (value: {
            [P in keyof TStorage]: InferCrdtStorageJson<TStorage[P]>;
        }) => void,
    ): (() => void) => {
        return this._crdtNotifier.subcribeRoot(fn);
    };

    public subscribe = <
        TSubject extends keyof StateNotifierSubjects<TIO, TPresence>,
    >(
        name: TSubject,
        callback: SubscriptionCallback<TIO, TPresence, TSubject>,
    ): (() => void) => {
        return this._stateNotifier.subscribe(name, callback);
    };

    public transact = (
        fn: (storage: TStorage) => void,
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

    public updateMyPresence = (presence: Partial<TPresence>): void => {
        this._usersManager.updateMyPresence(presence);

        const myPresence = this._usersManager.myPresence;
        const myself = this._usersManager.myself ?? null;

        this._stateNotifier.subjects["my-presence"].next(myPresence);
        !!myself && this._stateNotifier.subjects["myself"].next(myself);
    };

    private _observeCrdt(): void {
        this._subscriptions.observeCrdt?.();

        if (!this._crdtManager) return;

        const unsubscribe = this._crdtManager.doc.subscribe((event) => {
            const origin = event.origin ?? null;

            if (!this._crdtManager) return;
            if (origin === "$STORAGE_UPDATED") return;

            const sharedTypes = this._crdtManager.doc.get();

            const storageRoot = Object.entries(sharedTypes).reduce(
                (acc, [prop, sharedType]) => {
                    if (!this._crdtManager) return acc;

                    const serialized = sharedType.toJson();

                    this._crdtNotifier.subject(prop).next(serialized);

                    return { ...acc, [prop]: serialized };
                },
                {} as {
                    [P in keyof TStorage]: InferCrdtStorageJson<TStorage[P]>;
                },
            );

            this._crdtNotifier.rootSubject.next(storageRoot);
        });

        this._subscriptions.observeCrdt = unsubscribe;
    }
}
