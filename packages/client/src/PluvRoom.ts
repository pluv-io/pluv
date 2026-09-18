import type { InferDoc, InferDocLike, InferJson, InferStorage } from "@pluv/crdt";
import type {
    BaseIOEventRecord,
    BroadcastProxy,
    CrdtDocLike,
    EventMessage,
    EventNotifierSubscriptionCallback,
    EventProxy,
    IOEventMessage,
    IOLike,
    Id,
    InferIOAuthorize,
    InferIOAuthorizeUser,
    InferIOInput,
    InferIOOutput,
    JsonObject,
    ListUsersOptions,
    ListUsersResult,
    MergeEvents,
    OtherSubscriptionCallback,
    OthersSubscriptionCallback,
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
import type { AbstractStorageStore } from "./AbstractStorageStore";
import type { ClientDefs } from "./ClientDefs";
import {
    LIST_USERS_DEFAULT_LIMIT,
    LIST_USERS_MAX_LIMIT,
    LIST_USERS_TIMEOUT_MS,
} from "./constants";
import type { CrdtManagerOptions } from "./CrdtManager";
import { CrdtManager } from "./CrdtManager";
import { CrdtNotifier } from "./CrdtNotifier";
import { EventNotifier } from "./EventNotifier";
import { ListenerManager } from "./ListenerManager";
import { PendingRequestManager } from "./PendingRequestManager";
import { PluvProcedure } from "./PluvProcedure";
import { PluvRouter } from "./PluvRouter";
import { StateNotifier } from "./StateNotifier";
import { StorageStore } from "./StorageStore";
import type {
    AuthorizationState,
    EventResolver,
    EventResolverContext,
    InferClientInput,
    InferClientMetadata,
    InferClientOutput,
    InferClientPresence,
    InternalSubscriptions,
    PluvClientLimits,
    PublicKey,
    WithMetadata,
} from "./types";
import type { UsersManagerConfig } from "./UsersManager";
import { UsersManager } from "./UsersManager";
import { UsersNotifier } from "./UsersNotifier";
import { debounce, inRange, parsePluvSchema } from "./utils";

const ADD_TO_STORAGE_STATE_DEBOUNCE_MS = 1_000;
const HEARTBEAT_INTERVAL_MS = 10_000;
const PONG_TIMEOUT_MS = 2_000;

const RECONNECT_TIMEOUT_MS = 5_000;
const MIN_RECONNECT_TIMEOUT_MS = 1_000;
const MAX_RECONNECT_TIMEOUT_MS = 60_000;

const ORIGIN_INITIALIZED = "$initialized";
const ORIGIN_STORAGE_UPDATED = "$storageUpdated";

declare global {
    var process: {
        env: {
            [key: string]: string | undefined;
        };
    };
}

export const DEFAULT_PLUV_CLIENT_ADDON = <TDefs extends ClientDefs = ClientDefs>(
    input: PluvRoomAddonInput<TDefs>,
): PluvRoomAddonResult => ({
    storage: new StorageStore(input.room.id),
});

interface WindowListeners {
    onNavigatorOffline: () => void;
    onNavigatorOnline: () => void;
    onVisibilityChange: () => void;
    onWindowFocus: () => void;
}

interface WebSocketListeners {
    onClose: (event: CloseEvent) => void;
    onError: (event: Event) => void;
    onMessage: (message: MessageEvent<string>) => void;
    onOpen: (event: Event) => void;
}

interface IntervalIds {
    heartbeat: number | null;
}

interface TimeoutIds {
    pong: number | null;
    reconnect: number | null;
}

export interface EndpointParams<TMetadata extends JsonObject> {
    metadata: TMetadata;
    room: string;
}
export type AuthEndpoint<TMetadata extends JsonObject> =
    | string
    | ((params: EndpointParams<TMetadata>) => string | FetchOptions)
    | true;
export type WsEndpoint<TMetadata extends JsonObject> =
    | string
    | ((params: EndpointParams<TMetadata>) => string);

type FetchOptions = { url: string; options?: RequestInit };

export type RoomEndpoints<TMetadata extends JsonObject> = {
    wsEndpoint?: WsEndpoint<TMetadata>;
    authEndpoint: AuthEndpoint<TMetadata>;
};

interface InternalListeners {
    onAuthorizationFail: (error: Error) => void;
}

export type PluvRoomAddon<TDefs extends ClientDefs = ClientDefs> = (
    input: PluvRoomAddonInput<TDefs>,
) => Partial<PluvRoomAddonResult>;

export interface PluvRoomAddonInput<TDefs extends ClientDefs = ClientDefs> {
    room: PluvRoom<TDefs>;
}

export interface PluvRoomAddonResult {
    storage: AbstractStorageStore;
}

export type PluvRoomDebug<TIO extends IOLike> = Id<{
    output: readonly (keyof InferIOOutput<TIO>)[];
    input: readonly (keyof InferIOInput<TIO>)[];
}>;

type GetPublickKeyParams<TMetadata extends JsonObject = {}> = WithMetadata<TMetadata>;
type GetAuthEndpointParams<TMetadata extends JsonObject = {}> = WithMetadata<TMetadata>;
type GetWsEndpointParams<TMetadata extends JsonObject = {}> = WithMetadata<TMetadata>;

export type RoomConnectParams<TMetadata extends JsonObject = {}> = keyof TMetadata extends never
    ? []
    : [WithMetadata<TMetadata>];

export interface ReconnectTimeoutMsParams {
    attempts: number;
}
export type ReconnectTimeoutMs = number | ((params: ReconnectTimeoutMsParams) => number);

export type RoomConfig<TDefs extends ClientDefs = ClientDefs> = Id<
    {
        addons?: readonly PluvRoomAddon<any>[];
        debug?: boolean | PluvRoomDebug<TDefs["io"]>;
        limits: PluvClientLimits;
        onAuthorizationFail?: (error: Error) => void;
        metadata?: TDefs["metadata"];
        publicKey?: PublicKey<InferClientMetadata<TDefs>>;
        reconnectTimeoutMs?: ReconnectTimeoutMs;
        router?: PluvRouter<TDefs>;
    } & RoomEndpoints<InferClientMetadata<TDefs>> &
        Pick<CrdtManagerOptions<TDefs["storage"]>, "initialStorage" | "storage"> &
        UsersManagerConfig<InferClientPresence<TDefs>>
>;

export class PluvRoom<TDefs extends ClientDefs = ClientDefs> implements RoomLike<
    TDefs["io"],
    InferDoc<TDefs["storage"]>,
    InferClientPresence<TDefs>,
    InferStorage<TDefs["storage"]>,
    TDefs["events"],
    InferJson<TDefs["storage"]>
> {
    readonly _endpoints: RoomEndpoints<InferClientMetadata<TDefs>>;

    public readonly id: string;
    public readonly metadata?: TDefs["metadata"];

    private readonly _crdtManager: CrdtManager<TDefs["storage"]>;
    private readonly _crdtNotifier = new CrdtNotifier<InferJson<TDefs["storage"]>>();
    private readonly _debug: boolean | PluvRoomDebug<TDefs["io"]>;
    private readonly _eventNotifier = new EventNotifier<
        MergeEvents<TDefs["events"], TDefs["io"]>
    >();
    private readonly _intervals: IntervalIds = {
        heartbeat: null,
    };
    private readonly _limits: PluvClientLimits;
    private readonly _listenerManager = new ListenerManager();
    private readonly _listeners: InternalListeners;
    private readonly _publicKey: PublicKey<InferClientMetadata<TDefs>> | null = null;
    private readonly _reconnectTimeoutMs: ReconnectTimeoutMs;
    private readonly _requests = new PendingRequestManager();
    private readonly _router: PluvRouter<TDefs>;
    private readonly _stateNotifier = new StateNotifier<TDefs["io"], InferClientPresence<TDefs>>();
    private readonly _storageStore: AbstractStorageStore;
    private readonly _subscriptions: InternalSubscriptions = {
        observeCrdt: null,
    };
    private readonly _timeouts: TimeoutIds = {
        pong: null,
        reconnect: null,
    };
    private readonly _usersManager: UsersManager<TDefs["io"], InferClientPresence<TDefs>>;
    private readonly _usersNotifier = new UsersNotifier<TDefs["io"], InferClientPresence<TDefs>>();
    private _roomStats: RoomStats = { connectionCount: 0, userCount: 0 };

    private _lastMetadata: InferClientMetadata<TDefs> | null = null;
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
    private _windowListeners: WindowListeners | null = null;
    private _wsListeners: WebSocketListeners | null = null;

    constructor(room: string, options: RoomConfig<TDefs>) {
        const {
            addons = [],
            authEndpoint,
            debug = false,
            initialPresence,
            initialStorage,
            limits,
            metadata,
            onAuthorizationFail,
            presence,
            publicKey,
            reconnectTimeoutMs = RECONNECT_TIMEOUT_MS,
            router,
            storage: crdtStorage,
            wsEndpoint,
        } = options;

        this.id = room;
        this.metadata = metadata;

        const addon = this._getAddon(addons);
        const { storage } = {
            ...DEFAULT_PLUV_CLIENT_ADDON({ room: this }),
            ...addon({ room: this }),
        };
        this._storageStore = storage;

        this._debug = debug;
        this._endpoints = { authEndpoint, wsEndpoint } as RoomEndpoints<InferClientMetadata<TDefs>>;
        this._limits = limits;
        this._reconnectTimeoutMs = reconnectTimeoutMs;

        if (!!publicKey) this._publicKey = publicKey;

        this._listeners = {
            onAuthorizationFail: (error) => {
                onAuthorizationFail?.(error);
            },
        };

        this._router = router ?? (new PluvRouter({}) as PluvRouter<TDefs>);
        this._usersManager = new UsersManager<TDefs["io"], InferClientPresence<TDefs>>({
            initialPresence,
            limits: this._limits,
            presence,
        });
        this._crdtManager = new CrdtManager<TDefs["storage"]>({
            initialStorage,
            storage: crdtStorage,
        });
    }

    public get webSocket(): WebSocket | null {
        return this._state.webSocket;
    }

    public addEventListener<TKind extends keyof RoomEventListenerMap>(
        kind: TKind,
        handler: RoomEventListenerMap[TKind],
    ): () => void {
        return this._listenerManager.subscribe(kind, handler as any);
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
                this._sendMessage({ data, type });

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
                this._sendMessage({ data: _data, type: _type });
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

    public async connect(...args: RoomConnectParams<InferClientMetadata<TDefs>>): Promise<void> {
        const params = (args[0] ?? {}) as WithMetadata<InferClientMetadata<TDefs>>;
        const metadata = params.metadata as InferClientMetadata<TDefs>;

        this._setMetadata(metadata);

        const canConnect = [
            ConnectionState.Closed,
            ConnectionState.Unavailable,
            ConnectionState.Untouched,
        ].some((state) => this._state.connection.state === state);

        if (!canConnect) return;

        this._clearTimeout(this._timeouts.reconnect);
        this._updateState((oldState) => {
            oldState.connection.state = ConnectionState.Connecting;

            return oldState;
        });

        await this._storageStore.initialize();

        const wsEndpoint = this._getWsEndpoint(this.id, params);
        const url = new URL(wsEndpoint);

        let authToken: string | null = null;
        let webSocket: WebSocket;

        try {
            const publicKey = this._getPublicKey(params);

            authToken = await this._getAuthorization(this.id, params);

            if (authToken) url.searchParams.set("token", encodeURIComponent(authToken));
            if (publicKey) url.searchParams.set("public_key", encodeURIComponent(publicKey));

            webSocket = new WebSocket(url.toString());
        } catch (err) {
            this._updateState((oldState) => {
                oldState.connection.attempts += 1;

                return oldState;
            });

            await this._storageStore.destroy();
            this._pollReconnect();
            await Promise.resolve(this._onAuthorizationFail(err));

            return;
        }

        this._updateState((oldState) => {
            oldState.connection.attempts = 0;
            oldState.authorization.token = authToken;
            oldState.storage.state = StorageState.Loading;
            oldState.webSocket = webSocket;

            return oldState;
        });

        this._attachWindowListeners();
        this._attachWsListeners();
    }

    public async disconnect(): Promise<void> {
        if (!this._state.webSocket) return;

        const canDisconnect = [ConnectionState.Connecting, ConnectionState.Open].some(
            (state) => this._state.connection.state === state,
        );

        if (!canDisconnect) return;

        this._closeWs();
        this._clearInterval(this._intervals.heartbeat);
        this._clearTimeout(this._timeouts.reconnect);
        this._updateState((oldState) => {
            oldState.authorization.token = null;
            oldState.connection.state = ConnectionState.Closed;
            // Unlike `_onClose`, this destroys the doc below, so storage is gone.
            oldState.storage.state = StorageState.Unavailable;
            oldState.webSocket = null;

            return oldState;
        });

        await this._storageStore.destroy();
        this._crdtManager.destroy();

        // `destroy` swaps in a new doc, so stop observing the destroyed one.
        this._observeCrdt();
        this._stateNotifier.subjects["my-presence"].next(null);
    }

    public getConnection = (): WebSocketConnection => {
        // Create a read-only clone of the connection state
        return Object.freeze(JSON.parse(JSON.stringify(this._state.connection)));
    };

    public getDoc = (): CrdtDocLike<
        InferDoc<TDefs["storage"]>,
        InferStorage<TDefs["storage"]>,
        InferJson<TDefs["storage"]>
    > => {
        return this._crdtManager.doc;
    };

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

    public getRoomStats = (): RoomStats => {
        return this._roomStats;
    };

    public getStorage = <TKey extends keyof InferStorage<TDefs["storage"]>>(
        type: TKey,
    ): InferStorage<TDefs["storage"]>[TKey] | null => {
        // Updates aren't delivered until storage loads, so don't hand out a writable
        // shared-type that silently discards writes.
        if (!this.getStorageLoaded()) return null;

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

        const sharedType = this._crdtManager.get(type);

        if (typeof sharedType === "undefined") return null;

        return this._crdtManager.doc.toJson(type);
    }

    public getStorageLoaded = (): boolean => {
        return (
            this._state.storage.state === StorageState.Offline ||
            this._state.storage.state === StorageState.Synced
        );
    };

    public listUsers = (options: ListUsersOptions = {}): Promise<ListUsersResult<TDefs["io"]>> => {
        const resolved = options.limit ?? LIST_USERS_DEFAULT_LIMIT;

        if (!inRange(resolved, { min: 1, max: LIST_USERS_MAX_LIMIT })) {
            return Promise.resolve({
                success: false,
                error: {
                    code: "INVALID_LIMIT",
                    message: `Invalid listUsers limit. Limit must be an integer from 1 to ${LIST_USERS_MAX_LIMIT.toLocaleString()}. Received: ${String(options.limit)}.`,
                },
            });
        }

        if (!this._state.webSocket || this._state.connection.state !== ConnectionState.Open) {
            return Promise.resolve({
                success: false,
                error: { code: "NOT_CONNECTED", message: "Room is not connected" },
            });
        }

        const { promise, requestId } = this._requests.request<ListUsersResult<TDefs["io"]>>({
            onAbort: () => ({
                success: false,
                error: { code: "NOT_CONNECTED", message: "Room is not connected" },
            }),
            onTimeout: () => ({
                success: false,
                error: { code: "FAILED", message: "listUsers timed out" },
            }),
            timeoutMs: LIST_USERS_TIMEOUT_MS,
        });

        this._sendMessage({
            type: "$listUsers",
            data: {
                cursor: options.cursor ?? null,
                limit: resolved,
                requestId,
            },
        });

        return promise;
    };

    public redo = (): void => {
        this._crdtManager.doc.redo();
    };

    public subscribe = new Proxy(
        <TSubject extends keyof StateNotifierSubjects<TDefs["io"], InferClientPresence<TDefs>>>(
            name: TSubject,
            callback: SubscriptionCallback<TDefs["io"], InferClientPresence<TDefs>, TSubject>,
        ): (() => void) => this._stateNotifier.subscribe(name, callback),
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

                throw new Error(`Unknown subject: ${prop.toString()}`);
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

        /**
         * !HACK
         * @description Don't transact anything if there is no origin, because
         * that means the user isn't connected yet. This will mean events are
         * lost unfortunately.
         * @date September 23, 2023
         */
        if (typeof _origin !== "string") return;

        this._crdtManager.doc.transact(() => {
            const storage = this._crdtManager.doc.get();

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
        if (!!myself) this._stateNotifier.subjects.myself.next(myself);

        const canSend =
            !!this._state.webSocket && this._state.connection.state === ConnectionState.Open;

        if (canSend) this._usersManager.beginLocalPresenceWrite();

        this.broadcast(
            "$updatePresence" as keyof InferClientInput<TDefs>,
            { presence: newPresence } as any,
        );
    };

    private async _addToStorageStore(update: string): Promise<void> {
        await this._storageStore.addUpdate(update);

        this._flattenStorageStore();
    }

    private _attachWindowListeners(): void {
        if (typeof window === "undefined") return;
        if (typeof document === "undefined") return;

        this._windowListeners = this._windowListeners || {
            onNavigatorOffline: this._onNavigatorOffline.bind(this),
            onNavigatorOnline: this._onNavigatorOnline.bind(this),
            onVisibilityChange: this._onVisibilityChange.bind(this),
            onWindowFocus: this._onWindowFocus.bind(this),
        };

        window.addEventListener("offline", this._windowListeners.onNavigatorOffline);
        window.addEventListener("online", this._windowListeners.onNavigatorOnline);
        document.addEventListener("visibilitychange", this._windowListeners.onVisibilityChange);
        window.addEventListener("focus", this._windowListeners.onWindowFocus);
    }

    private _attachWsListeners(): void {
        if (!this._state.webSocket) return;

        this._wsListeners = this._wsListeners || {
            onClose: this._onClose.bind(this),
            onError: this._onError.bind(this),
            onMessage: this._onMessage.bind(this),
            onOpen: this._onOpen.bind(this),
        };

        this._state.webSocket.addEventListener("close", this._wsListeners.onClose);
        this._state.webSocket.addEventListener("error", this._wsListeners.onError);
        this._state.webSocket.addEventListener("message", this._wsListeners.onMessage);
        this._state.webSocket.addEventListener("open", this._wsListeners.onOpen);
    }

    private _clearInterval(interval: number | null) {
        if (Number.isNaN(interval)) return;

        clearInterval(interval as number);
    }

    private _clearTimeout(timeout: number | null) {
        if (Number.isNaN(timeout)) return;

        clearTimeout(timeout as number);
    }

    private _closeWs(): void {
        this._subscriptions.observeCrdt?.();

        this._clearInterval(this._intervals.heartbeat);
        this._clearTimeout(this._timeouts.pong);
        this._detachWindowListeners();
        this._usersManager.removeMyself();
        this._usersManager.clearConnections();
        this._usersNotifier.clear();
        this._stateNotifier.subjects.myself.next(null);
        this._stateNotifier.subjects.others.next([]);
        this._usersNotifier.others.next({ others: [], event: { kind: "clear" } });
        this._roomStats = { connectionCount: 0, userCount: 0 };
        this._stateNotifier.subjects.roomStats.next(this._roomStats);
        this._requests.failAll();
        this._state.webSocket?.close();

        this._detachWsListeners();
    }

    private _detachWindowListeners(): void {
        if (!this._windowListeners) return;
        if (typeof window === "undefined") return;
        if (typeof document === "undefined") return;

        window.removeEventListener("offline", this._windowListeners.onNavigatorOffline);
        window.removeEventListener("online", this._windowListeners.onNavigatorOnline);
        document.removeEventListener("visibilitychange", this._windowListeners.onVisibilityChange);
        window.removeEventListener("focus", this._windowListeners.onWindowFocus);

        this._windowListeners = null;
    }

    private _detachWsListeners(): void {
        if (!this._state.webSocket || !this._wsListeners) return;

        this._state.webSocket.removeEventListener("close", this._wsListeners.onClose);
        this._state.webSocket.removeEventListener("error", this._wsListeners.onError);
        this._state.webSocket.removeEventListener("message", this._wsListeners.onMessage);
        this._state.webSocket.removeEventListener("open", this._wsListeners.onOpen);

        this._wsListeners = null;
    }

    private _emitSharedTypes(): void {
        const sharedTypes = this._crdtManager.doc.get();

        const storageRoot = Object.keys(sharedTypes).reduce(
            (acc, prop) => {
                const serialized = this._crdtManager.doc.toJson(prop);

                this._crdtNotifier.subject(prop).next(serialized);

                acc[prop as keyof InferStorage<TDefs["storage"]>] = serialized;

                return acc;
            },
            {} as InferJson<TDefs["storage"]>,
        );

        this._crdtNotifier.rootSubject.next(storageRoot);
    }

    private _event = new Proxy(
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

    private _flattenStorageStore = debounce(
        async (): Promise<void> => {
            const shouldFlatten = await this._storageStore.getShouldFlatten();

            if (!shouldFlatten) return;

            const updates = await this._storageStore.getUpdates();

            this._crdtManager.applyUpdate({ update: updates, origin: this });

            const encodedState = this._crdtManager.doc.getEncodedState();

            await this._storageStore.flatten(encodedState);
        },
        { wait: ADD_TO_STORAGE_STATE_DEBOUNCE_MS },
    );

    private _getAddon = (addons: readonly PluvRoomAddon<TDefs>[]): PluvRoomAddon<TDefs> => {
        return addons.reduce<PluvRoomAddon<TDefs>>(
            (acc, addon) => () => ({
                ...acc({ room: this }),
                ...addon({ room: this }),
            }),
            DEFAULT_PLUV_CLIENT_ADDON,
        );
    };

    private _getAuthFetchOptions(
        room: string,
        params: GetAuthEndpointParams<InferClientMetadata<TDefs>>,
    ): FetchOptions | null {
        const metadata = params.metadata as InferClientMetadata<TDefs>;

        if (typeof this._endpoints.authEndpoint === "undefined") return null;

        if (this._endpoints.authEndpoint === true) {
            return {
                url: `/api/pluv/authorize?room=${room}`,
                options: {},
            };
        }

        if (typeof this._endpoints.authEndpoint === "string") {
            return {
                url: this._endpoints.authEndpoint,
                options: {},
            };
        }

        const result = this._endpoints.authEndpoint({ metadata, room });

        return typeof result === "string" ? { url: result, options: {} } : result;
    }

    private async _getAuthorization(
        room: string,
        params: GetAuthEndpointParams<InferClientMetadata<TDefs>>,
    ): Promise<string | null> {
        const fetchOptions = this._getAuthFetchOptions(room, params);

        if (!fetchOptions) return null;

        const { url, options } = fetchOptions;
        const res = await fetch(url, options);

        if (!res.ok || res.status !== 200) throw new Error("Room is unauthorized");

        try {
            return await res.text().then((text) => text.trim());
        } catch (err) {
            throw new Error(err instanceof Error ? err.message : "Room is unauthorized", {
                cause: err,
            });
        }
    }

    private _getPublicKey(params: GetPublickKeyParams<InferClientMetadata<TDefs>>): string | null {
        const metadata = params.metadata as InferClientMetadata<TDefs>;

        if (!this._publicKey) return null;
        if (typeof this._publicKey === "string") return this._publicKey;

        return this._publicKey({ metadata });
    }

    private _getWsEndpoint(
        room: string,
        params: GetWsEndpointParams<InferClientMetadata<TDefs>>,
    ): string {
        const metadata = params.metadata as InferClientMetadata<TDefs>;

        switch (typeof this._endpoints.wsEndpoint) {
            case "undefined":
                return !!this._getPublicKey(params)
                    ? `wss://rooms.pluv.io/api/room/${room}`
                    : `/api/pluv/room/${room}`;
            case "string":
                return this._endpoints.wsEndpoint;
            default:
                return this._endpoints.wsEndpoint({ metadata, room });
        }
    }

    private _handleExit(message: IOEventMessage<TDefs["io"]>): void {
        const { connectionId } = message;

        if (!connectionId) return;
        // Should not reach here
        if (!this._state.webSocket) throw new Error("Could not find WebSocket");

        const clientId = this._usersManager.getClientId(connectionId);
        const myClientId = this._usersManager.myself
            ? this._usersManager.getClientId(this._usersManager.myself)
            : null;
        const deleted = this._usersManager.deleteConnection(connectionId);
        const others = this._usersManager.getOthers();

        this._stateNotifier.subjects.others.next(others);

        if (!deleted) {
            // Own sibling tabs live on `_myself`, not `_others`.
            if (clientId && clientId === myClientId) return;

            console.warn("Could not identify exited connection");
            return;
        }

        const { data: user, remaining } = deleted;

        if (remaining) return;

        this._usersNotifier.others.next({
            others,
            event: { kind: "leave", user },
        });

        if (clientId) this._usersNotifier.delete(clientId);
    }

    private _handlePresenceUpdatedMessage(message: IOEventMessage<TDefs["io"]>): void {
        const { connectionId } = message;

        if (!connectionId) return;
        // Should not reach here
        if (!this._state.webSocket) throw new Error("Could not find WebSocket");

        const data = message.data as BaseIOEventRecord<
            InferIOAuthorize<TDefs["io"]>
        >["$presenceUpdated"];
        const myself = this._usersManager.myself ?? null;

        /**
         * This is our own presence coming back from the server. Ignore it if we
         * have already sent a newer local update, so a burst of writes (for
         * example dragging) cannot snap backward. Apply the last reply so we
         * can still pick up a newer value from another tab.
         */
        if (
            connectionId === this._state.connection.id &&
            !this._usersManager.ackOwnPresenceEcho()
        ) {
            return;
        }

        const patched = this._usersManager.patchPresence(
            connectionId,
            data.presence as InferClientPresence<TDefs>,
            data.timers.presence,
        );
        const myClientId = !!myself ? this._usersManager.getClientId(myself) : null;
        const clientId = this._usersManager.getClientId(connectionId);

        if (!patched) {
            /**
             * !HACK
             * @description User could not be found. Add the connection to keep others up-to-date
             * @date April 19, 2025
             */
            const added = this._usersManager.addConnection({
                connectionId,
                data: message.user as Id<InferIOAuthorizeUser<InferIOAuthorize<TDefs["io"]>>>,
                presence: data.presence as InferClientPresence<TDefs>,
                presenceTimer: data.timers.presence,
            });

            if (!added.presenceChanged) return;

            const other = this._usersManager.getOther(added.clientId);
            const others = this._usersManager.getOthers();

            this._usersNotifier.other(added.clientId).next(other);
            this._stateNotifier.subjects.others.next(others);

            this._usersNotifier.others.next({
                others,
                event: { kind: "update", user: added.data },
            });

            return;
        }

        if (!patched.applied) return;

        const updated = patched.presence;

        if (!!clientId && myClientId === clientId) {
            this._stateNotifier.subjects["my-presence"].next(updated);
            this._stateNotifier.subjects.myself.next(this._usersManager.myself);

            return;
        }

        if (!!clientId) {
            const other = this._usersManager.getOther(clientId);
            const others = this._usersManager.getOthers();

            this._usersNotifier.other(clientId).next(other);
            this._stateNotifier.subjects.others.next(others);

            if (!!other) {
                this._usersNotifier.others.next({
                    others,
                    event: { kind: "update", user: other },
                });
            }

            return;
        }
    }

    private _handleReceiveOthers(message: IOEventMessage<TDefs["io"]>): void {
        // Should not reach here
        if (!this._state.webSocket) throw new Error("Could not find WebSocket");

        const data = message.data as BaseIOEventRecord<
            InferIOAuthorize<TDefs["io"]>
        >["$othersReceived"];

        const leftIds = this._usersManager.replaceOthers(
            data.others.map((other) => ({
                connectionIds: other.connectionIds,
                data: other.data,
                presence: other.presence as InferClientPresence<TDefs> | null,
                presenceTimer: other.timers.presence,
            })),
        );
        this._usersManager.setMyConnectionIds(data.myConnectionIds);

        leftIds.forEach((clientId) => {
            this._usersNotifier.delete(clientId);
        });

        data.others.forEach((row) => {
            const connectionId = row.connectionIds[0];
            if (!connectionId) return;

            const clientId = this._usersManager.getClientId(connectionId);
            if (!clientId) return;

            const other = this._usersManager.getOther(clientId);

            this._usersNotifier.other(clientId).next(other);
        });

        const others = this._usersManager.getOthers();

        this._stateNotifier.subjects.others.next(others);
        this._usersNotifier.others.next({
            others,
            event: { kind: "sync", users: others },
        });
    }

    private async _handleRegisteredMessage(message: IOEventMessage<TDefs["io"]>): Promise<void> {
        const { connectionId } = message;
        const user = message.user as Id<InferIOAuthorizeUser<InferIOAuthorize<TDefs["io"]>>>;

        if (!connectionId) return;
        // Should not reach here
        if (!this._state.webSocket) throw new Error("Could not find WebSocket");

        const data = message.data as BaseIOEventRecord<
            InferIOAuthorize<TDefs["io"]>
        >["$registered"];
        const state = data.state;

        this._roomStats = {
            connectionCount: data.connectionCount,
            userCount: data.userCount,
        };
        this._stateNotifier.subjects.roomStats.next(this._roomStats);

        this._updateState((oldState) => {
            oldState.connection.id = connectionId;
            oldState.authorization.user = user;

            return oldState;
        });

        this._usersManager.setMyself({
            connectionId,
            data: user,
            presence: (data.presence as InferClientPresence<TDefs> | null) ?? undefined,
            presenceTimer: data.timers.presence,
        });

        const presence = this._usersManager.myPresence;
        const myself = this._usersManager.myself ?? null;

        this._stateNotifier.subjects["my-presence"].next(presence);
        this._stateNotifier.subjects.myself.next(myself);

        const update = await (async () => {
            if (!!state) {
                this._logDebug("Retrieving initial state");
                return this._crdtManager.getInitialState();
            }

            const resolved = this._crdtManager.resolveEncodedState(
                await this._storageStore.getUpdates(),
            );

            if (!!resolved) {
                this._logDebug("Retrieving storage store state");
                return resolved;
            }

            this._logDebug("Retrieving initial state");
            return this._crdtManager.getInitialState();
        })();

        this._sendMessage({
            type: "$initializeSession",
            data: { presence, update },
        });
    }

    private async _handleStorageReceivedMessage(
        message: IOEventMessage<TDefs["io"]>,
    ): Promise<void> {
        const { connectionId } = message;

        if (!connectionId) return;
        // Should not reach here
        if (!this._state.webSocket) throw new Error("Could not find WebSocket");

        const data = message.data as BaseIOEventRecord<
            InferIOAuthorize<TDefs["io"]>
        >["$storageReceived"];
        const changeKind = data.changeKind;
        const state = data.state;

        const updates = await this._storageStore.getUpdates();
        const origin = ORIGIN_INITIALIZED;

        const updateStorage = (update: string | readonly string[]) => {
            return this._crdtManager.initialized
                ? this._crdtManager.applyUpdate({ update, origin })
                : this._crdtManager.initialize({ update, origin });
        };

        if (changeKind === "empty") {
            this._crdtManager.destroy();
            this._crdtManager.initialize({ origin, update: updates });
        } else if (changeKind === "initialized") {
            if (!!updates.length) updateStorage(updates);
            else {
                const encodedState = updateStorage(state).doc.getEncodedState();

                this._addToStorageStore(encodedState);
            }
        } else {
            const encodedState = updateStorage(state).doc.getEncodedState();

            if (!!updates.length) this._crdtManager.applyUpdate({ update: updates, origin });

            await this._addToStorageStore(encodedState);
        }

        const encodedState = this._crdtManager.doc.getEncodedState();

        // Must precede `_emitSharedTypes`, since `getStorage` returns null until loaded.
        this._updateState((oldState) => {
            oldState.storage.state = StorageState.Synced;

            return oldState;
        });
        this._emitSharedTypes();
        this._observeCrdt();
        this._stateNotifier.subjects["storage-loaded"].next(true);

        this._sendMessage({
            type: "$updateStorage",
            data: { origin, update: encodedState },
        });
    }

    private _handleStorageUpdatedMessage(message: IOEventMessage<TDefs["io"]>): void {
        const { connectionId } = message;

        if (!connectionId) return;
        // Should not reach here
        if (!this._state.webSocket) throw new Error("Could not find WebSocket");

        const data = message.data as BaseIOEventRecord<
            InferIOAuthorize<TDefs["io"]>
        >[typeof ORIGIN_STORAGE_UPDATED];

        this._crdtManager.doc.applyEncodedState({
            origin: ORIGIN_STORAGE_UPDATED,
            update: data.state,
        });

        const sharedTypes = this._crdtManager.doc.get();

        const storageRoot = Object.keys(sharedTypes).reduce(
            (acc, prop) => {
                const serialized = this._crdtManager.doc.toJson(prop);

                this._crdtNotifier.subject(prop).next(serialized);

                acc[prop as keyof InferStorage<TDefs["storage"]>] = serialized;

                return acc;
            },
            {} as InferJson<TDefs["storage"]>,
        );

        this._crdtNotifier.rootSubject.next(storageRoot);
    }

    private _handleSyncStateReceived(message: IOEventMessage<TDefs["io"]>): void {
        // Should not reach here
        if (!this._state.webSocket) throw new Error("Could not find WebSocket");
        if (!this._usersManager.myself) return;

        const data = message.data as BaseIOEventRecord<
            InferIOAuthorize<TDefs["io"]>
        >["$syncStateReceived"];
        const active = new Set(data?.connectionIds ?? []);
        const left = this._usersManager.pruneConnections(active);

        left.forEach((quitter) => {
            const remaining = this._usersManager.getOthers();
            const clientId = this._usersManager.getClientId(quitter);

            this._usersNotifier.delete(clientId);
            this._usersNotifier.others.next({
                others: remaining,
                event: { kind: "leave", user: quitter },
            });
        });

        const remaining = this._usersManager.getOthers();

        this._stateNotifier.subjects.others.next(remaining);
    }

    private _handleRoomStats(message: IOEventMessage<TDefs["io"]>): void {
        const data = message.data as BaseIOEventRecord<InferIOAuthorize<TDefs["io"]>>["$roomStats"];

        this._roomStats = {
            connectionCount: data.connectionCount,
            userCount: data.userCount,
        };
        this._stateNotifier.subjects.roomStats.next(this._roomStats);
    }

    private _handleUsersPage(message: IOEventMessage<TDefs["io"]>): void {
        const data = message.data as BaseIOEventRecord<InferIOAuthorize<TDefs["io"]>>["$usersPage"];

        this._requests.complete(
            data.requestId,
            data.success
                ? { success: true, pageInfo: data.pageInfo, users: data.users }
                : { success: false, error: data.error },
        );
    }

    private _handleUserJoinedMessage(message: IOEventMessage<TDefs["io"]>): void {
        const { connectionId } = message;

        if (!connectionId) return;
        // Should not reach here
        if (!this._state.webSocket) throw new Error("Could not find WebSocket");
        if (!this._usersManager.myself) return;

        const data = message.data as BaseIOEventRecord<
            InferIOAuthorize<TDefs["io"]>
        >["$userJoined"];

        if (connectionId === this._state.connection.id) {
            this._sendMessage({ type: "$getOthers", data: {} });
            return;
        }

        const added = this._usersManager.addConnection({
            connectionId,
            data: data.user,
            presence: data.presence as InferClientPresence<TDefs>,
            presenceTimer: data.timers.presence,
        });

        if (added.isMyself) return;

        const other = this._usersManager.getOther(added.clientId);
        const others = this._usersManager.getOthers();

        if (added.remaining !== 1) {
            if (!added.presenceChanged || !other) return;

            this._usersNotifier.other(added.clientId).next(other);
            this._stateNotifier.subjects.others.next(others);
            this._usersNotifier.others.next({
                others,
                event: { kind: "update", user: other },
            });

            return;
        }

        this._usersNotifier.other(added.clientId).next(other);
        this._stateNotifier.subjects.others.next(others);
        this._usersNotifier.others.next({
            others,
            event: { kind: "enter", user: added.data },
        });
    }

    private _heartbeat(): void {
        this._clearTimeout(this._timeouts.pong);
        this._timeouts.pong = setTimeout(
            this._reconnect.bind(this),
            PONG_TIMEOUT_MS,
        ) as unknown as number;

        /**
         * !HACK
         * @description Send data as a stable string so that the server can react to this in a
         * consistent way.
         * @date July 8, 2024
         */
        this._sendMessage('{"type":"$ping","data":{}}');
    }

    private _logDebug(...data: any[]): void {
        if (typeof process === "undefined") return;
        if (process.env?.NODE_ENV === "production") return;
        if (this._debug) console.log(...data);
    }

    private _observeCrdt(): void {
        this._subscriptions.observeCrdt?.();

        const unsubscribe = this._crdtManager.doc.subscribe((event) => {
            const origin = event.origin ?? null;

            this._emitSharedTypes();

            if (origin === ORIGIN_INITIALIZED || origin === ORIGIN_STORAGE_UPDATED) {
                return;
            }

            this._addToStorageStore(event.update);

            const canSend =
                !!this._state.webSocket &&
                !!this._state.connection.id &&
                this._state.webSocket.readyState === WebSocket.OPEN;

            if (!canSend) {
                this._logDebug("Dropped a storage update: storage is not syncing");

                return;
            }

            this._sendMessage({
                type: "$updateStorage",
                data: { origin, update: event.update },
            });
        });

        this._subscriptions.observeCrdt = unsubscribe;
    }

    private _onAuthorizationFail(error: unknown): void {
        const authError = error instanceof Error ? error : new Error("Authorization failed");

        this._listeners.onAuthorizationFail(authError);

        this._updateState((oldState) => {
            oldState.connection.state = ConnectionState.Unavailable;
            oldState.storage.state = StorageState.Unavailable;

            return oldState;
        });
    }

    private async _onClose(event: CloseEvent): Promise<void> {
        this._listenerManager.subjects.close.next(event);

        this._logDebug("WebSocket closed");
        if (!!event.reason) this._logDebug(event.reason);

        const shouldRetry = [
            // Going away: Client/server is shutting down or navigating
            1001,
            // Abnormal closure: Usually network error
            1006,
            // Internal error: may be a larger problem, but try reconnecting for now
            1011,
            // Service restart: Server restarted
            1012,
            // Try again later: server overloaded
            1013,
            // Bad gateway
            1014,
        ].some((okToRetryCode) => event.code === okToRetryCode);

        this._updateState((oldState) => {
            oldState.authorization.token = null;
            oldState.connection.state = shouldRetry
                ? ConnectionState.Unavailable
                : /**
                   * !HACK
                   * @description Assume these are not recoverable. We're just going to mark this
                   * as Closed to avoid reconnect attempts.
                   * @date April 28, 2025
                   */
                  ConnectionState.Closed;
            oldState.storage.state =
                oldState.storage.state === StorageState.Synced
                    ? StorageState.Offline
                    : StorageState.Unavailable;
            oldState.webSocket = null;

            return oldState;
        });

        if (shouldRetry) {
            await this._reconnect();
            return;
        }

        this._closeWs();
        this._clearTimeout(this._timeouts.reconnect);
    }

    /**
     * TODO
     * @description Handle websocket errors in a meaningful way, should they occur
     * @date August 19, 2022
     */
    private _onError(event: Event): void {
        this._listenerManager.subjects.error.next(event);
    }

    private _onMessage(event: MessageEvent<string>): void {
        this._listenerManager.subjects.message.next(event);

        const message = this._parseMessage(event);

        if (!message) return;

        const shouldLog =
            typeof this._debug === "boolean"
                ? this._debug
                : this._debug.output.find((value) => value === message.type);

        if (shouldLog) {
            this._logDebug("WebSocket event received: ", message.type, message);
        }

        this._eventNotifier
            .subject(message.type as keyof InferClientOutput<TDefs>)
            .next(message as any);

        switch (message.type) {
            case "$exit": {
                this._handleExit(message);
                return;
            }
            case "$othersReceived": {
                this._handleReceiveOthers(message);
                return;
            }
            case "$pong": {
                this._clearTimeout(this._timeouts.pong);
                return;
            }
            case "$presenceUpdated": {
                this._handlePresenceUpdatedMessage(message);
                return;
            }
            case "$registered": {
                this._handleRegisteredMessage(message);
                return;
            }
            case "$roomStats": {
                this._handleRoomStats(message);
                return;
            }
            case "$storageReceived": {
                this._handleStorageReceivedMessage(message);
                return;
            }
            case "$storageUpdated": {
                this._handleStorageUpdatedMessage(message);
                return;
            }
            case "$syncStateReceived": {
                this._handleSyncStateReceived(message);
                return;
            }
            case "$userJoined": {
                this._handleUserJoinedMessage(message);
                return;
            }
            case "$usersPage": {
                this._handleUsersPage(message);
                return;
            }
            default:
        }
    }

    private _onOpen(event: Event): void {
        this._listenerManager.subjects.open.next(event);

        if (this._state.connection.state !== ConnectionState.Connecting) return;

        this._logDebug("WebSocket connected");
        this._updateState((oldState) => {
            oldState.connection.state = ConnectionState.Open;

            return oldState;
        });

        this._clearInterval(this._intervals.heartbeat);
        this._intervals.heartbeat = setInterval(
            this._heartbeat.bind(this),
            HEARTBEAT_INTERVAL_MS,
        ) as unknown as number;
    }

    private async _onNavigatorOffline(): Promise<void> {
        if (this._state.connection.state === ConnectionState.Closed) return;

        this._updateState((oldState) => {
            oldState.connection.state = ConnectionState.Unavailable;
            oldState.storage.state =
                oldState.storage.state === StorageState.Synced
                    ? StorageState.Offline
                    : StorageState.Unavailable;

            return oldState;
        });
    }

    private async _onNavigatorOnline(): Promise<void> {
        if (this._state.connection.state !== ConnectionState.Unavailable) return;

        await this._reconnect();
    }

    private async _onVisibilityChange(): Promise<void> {
        if (typeof document === "undefined") return;
        if (document.visibilityState !== "visible") return;

        switch (this._state.connection.state) {
            case ConnectionState.Open: {
                this._clearInterval(this._intervals.heartbeat);
                setInterval(this._heartbeat.bind(this), HEARTBEAT_INTERVAL_MS);

                return;
            }
            case ConnectionState.Unavailable: {
                await this._reconnect();

                return;
            }
            default:
        }
    }

    private async _onWindowFocus(): Promise<void> {
        return await this._onVisibilityChange();
    }

    private _other = (
        userId: string,
        callback: OtherSubscriptionCallback<TDefs["io"], InferClientPresence<TDefs>>,
    ): (() => void) => {
        return this._usersNotifier.subscribeOther(userId, callback);
    };

    private _parseMessage(message: {
        data: string | ArrayBuffer;
    }): IOEventMessage<TDefs["io"]> | null {
        /**
         * !HACK
         * @description We'll only handle stringified JSONs for now
         * @date August 9, 2022
         */
        if (typeof message.data !== "string") return null;

        try {
            const config = JSON.parse(message.data);

            if (typeof config !== "object") return null;
            if (typeof config.type !== "string") return null;
            if (typeof config.data !== "object") return null;

            return config as IOEventMessage<TDefs["io"]>;
        } catch {
            return null;
        }
    }

    private _pollReconnect(): void {
        this._clearTimeout(this._timeouts.reconnect);

        const timeoutMs =
            typeof this._reconnectTimeoutMs === "number"
                ? this._reconnectTimeoutMs
                : this._reconnectTimeoutMs({ attempts: this._state.connection.attempts });
        const clampedMs = Math.max(
            Math.min(MIN_RECONNECT_TIMEOUT_MS, timeoutMs),
            MAX_RECONNECT_TIMEOUT_MS,
        );

        this._timeouts.reconnect = setTimeout(
            this._reconnect.bind(this),
            clampedMs,
        ) as unknown as number;
    }

    private async _reconnect(): Promise<void> {
        this._closeWs();

        /**
         * @description User has manually closed this connection. We're not going to retry, since
         * the user probably intends for this to stay closed. They will need to invoke connect
         * themselves.
         * @date April 28, 2025
         */
        if (this._state.connection.state === ConnectionState.Closed) return;

        const metadata = this._lastMetadata;
        const params = (typeof metadata === "undefined" ? [] : [{ metadata }]) as RoomConnectParams<
            InferClientMetadata<TDefs>
        >;

        await this.connect(...params);
    }

    private _sendMessage(data: string): void;
    private _sendMessage<TMessage extends EventMessage<string, any> = EventMessage<string, any>>(
        data: TMessage,
    ): void;
    private _sendMessage(data: any): void {
        const webSocket = this._state.webSocket;

        if (webSocket?.readyState !== WebSocket.OPEN) return;

        const dataType: string | null = ((): string | null => {
            if (typeof data === "object") return data.type ?? null;
            if (typeof data !== "string") return null;

            try {
                return JSON.parse(data)?.type ?? null;
            } catch {
                return null;
            }
        })();

        const shouldLog: boolean =
            typeof this._debug === "boolean"
                ? this._debug
                : !dataType
                  ? false
                  : this._debug.input.some((value) => value === data.type);

        if (shouldLog) this._logDebug("WebSocket event sent: ", data.type, data);

        const message = typeof data === "string" ? data : JSON.stringify(data);

        webSocket.send(message);
    }

    private _setMetadata(metadata: InferClientMetadata<TDefs>): InferClientMetadata<TDefs> {
        const parsed = this.metadata ? parsePluvSchema(this.metadata, metadata) : metadata;

        this._lastMetadata = parsed;

        return parsed;
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

    private _updateState(
        updater: (oldState: WebSocketState<TDefs["io"]>) => WebSocketState<TDefs["io"]>,
    ): WebSocketState<TDefs["io"]> {
        let authorization: AuthorizationState<TDefs["io"]>;

        try {
            authorization = JSON.parse(JSON.stringify(this._state.authorization));
        } catch {
            throw new Error("User is not JSON serializable");
        }

        const oldState: WebSocketState<TDefs["io"]> = {
            ...this._state,
            authorization,
            connection: JSON.parse(JSON.stringify(this._state.connection)),
            storage: JSON.parse(JSON.stringify(this._state.storage)),
            webSocket: this._state.webSocket,
        };

        const newState = updater(oldState);
        this._state = newState;

        this._logDebug("WebSocket new state: ", newState);
        this._stateNotifier.subjects.connection.next(newState);

        return newState;
    }
}
