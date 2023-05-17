import type { InferYjsSharedTypeJson } from "@pluv/crdt-yjs";
import type {
    Id,
    InferIOInput,
    InferIOOutput,
    IOLike,
    JsonObject,
} from "@pluv/types";
import type { AbstractType } from "yjs";
import { AbstractRoom } from "./AbstractRoom";
import { CrdtManager, CrdtManagerOptions } from "./CrdtManager";
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
import type {
    InternalSubscriptions,
    UserInfo,
    WebSocketConnection,
    WebSocketState,
} from "./types";
import { ConnectionState } from "./types";
import type { UsersManagerConfig } from "./UsersManager";
import { UsersManager } from "./UsersManager";

export type MockedRoomEvents<TIO extends IOLike> = Partial<{
    [P in keyof InferIOInput<TIO>]: (
        data: Id<InferIOInput<TIO>[P]>
    ) => Partial<InferIOOutput<TIO>>;
}>;

export type MockedRoomConfig<
    TIO extends IOLike,
    TPresence extends JsonObject = {},
    TStorage extends Record<string, AbstractType<any>> = {}
> = { events?: MockedRoomEvents<TIO> } & Omit<
    CrdtManagerOptions<TStorage>,
    "encodedState"
> &
    UsersManagerConfig<TPresence>;

export class MockedRoom<
    TIO extends IOLike,
    TPresence extends JsonObject = {},
    TStorage extends Record<string, AbstractType<any>> = {}
> extends AbstractRoom<TIO, TPresence, TStorage> {
    private _crdtManager: CrdtManager<TStorage> | null = null;
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
        options: MockedRoomConfig<TIO, TPresence, TStorage>
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
        data: Id<InferIOInput<TIO>[TEvent]>
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

    public event = <TEvent extends keyof InferIOOutput<TIO>>(
        event: TEvent,
        callback: EventNotifierSubscriptionCallback<TIO, TEvent>
    ): (() => void) => {
        return this._eventNotifier.subscribe(event, callback);
    };

    public getConnection(): WebSocketConnection {
        // Create a read-only clone of the connection state
        return Object.freeze(
            JSON.parse(JSON.stringify(this._state.connection))
        );
    }

    public getMyPresence = (): TPresence => {
        return this._usersManager.myPresence;
    };

    public getMyself = (): Id<UserInfo<TIO, TPresence>> | null => {
        return this._usersManager.myself;
    };

    public getOther = (
        connectionId: string
    ): Id<UserInfo<TIO, TPresence>> | null => {
        return this._usersManager.getOther(connectionId);
    };

    public getOthers = (): readonly Id<UserInfo<TIO, TPresence>>[] => {
        return this._usersManager.getOthers();
    };

    public getStorage = <TKey extends keyof TStorage>(
        key: TKey
    ): TStorage[TKey] | null => {
        return this._crdtManager?.get(key) ?? null;
    };

    public other = (
        connectionId: string,
        callback: OtherNotifierSubscriptionCallback<TIO>
    ): (() => void) => {
        return this._otherNotifier.subscribe(connectionId, callback);
    };

    public storage = <TKey extends keyof TStorage>(
        key: TKey,
        fn: (value: InferYjsSharedTypeJson<TStorage[TKey]>) => void
    ): (() => void) => {
        return this._crdtNotifier.subscribe(key, fn);
    };

    public subscribe = <
        TSubject extends keyof StateNotifierSubjects<TIO, TPresence>
    >(
        name: TSubject,
        callback: SubscriptionCallback<TIO, TPresence, TSubject>
    ): (() => void) => {
        return this._stateNotifier.subscribe(name, callback);
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

        const unsubscribe = this._crdtManager.doc.subscribe(
            (update, _origin) => {
                const origin = _origin ?? null;

                if (!this._crdtManager) return;
                if (origin === "$STORAGE_UPDATED") return;

                const sharedTypes = this._crdtManager.doc.getSharedTypes();

                Object.entries(sharedTypes).forEach(([prop, sharedType]) => {
                    if (!this._crdtManager) return;

                    const serialized = sharedType.toJSON();

                    this._crdtNotifier.subject(prop).next(serialized);
                });
            }
        );

        this._subscriptions.observeCrdt = unsubscribe;
    }
}
