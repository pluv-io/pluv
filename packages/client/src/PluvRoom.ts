import type {
    AbstractCrdtDocFactory,
    InferCrdtJson,
    InferStorage,
    NoopCrdtDocFactory,
} from "@pluv/crdt";
import type {
    BaseIOEventRecord,
    BaseUser,
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
    InputZodLike,
    JsonObject,
    MergeEvents,
    OptionalProps,
    OtherNotifierSubscriptionCallback,
    OthersNotifierSubscriptionCallback,
    RoomLike,
    UpdateMyPresenceAction,
    UserInfo,
    WebSocketState,
} from "@pluv/types";
import { ConnectionState } from "@pluv/types";
import type { AbstractStorageStore } from "./AbstractStorageStore";
import type { CrdtManagerOptions } from "./CrdtManager";
import { CrdtManager } from "./CrdtManager";
import { CrdtNotifier } from "./CrdtNotifier";
import { EventNotifier } from "./EventNotifier";
import { PluvProcedure } from "./PluvProcedure";
import type { PluvRouterEventConfig } from "./PluvRouter";
import { PluvRouter } from "./PluvRouter";
import type { StateNotifierSubjects, SubscriptionCallback } from "./StateNotifier";
import { StateNotifier } from "./StateNotifier";
import { StorageStore } from "./StorageStore";
import type {
    AuthorizationState,
    EventResolver,
    EventResolverContext,
    InternalSubscriptions,
    PluvClientLimits,
    PublicKey,
    WebSocketConnection,
    WithMetadata,
} from "./types";
import type { UsersManagerConfig } from "./UsersManager";
import { UsersManager } from "./UsersManager";
import { UsersNotifier } from "./UsersNotifier";
import { debounce } from "./utils";

const ADD_TO_STORAGE_STATE_DEBOUNCE_MS = 1_000;
const HEARTBEAT_INTERVAL_MS = 10_000;
const PONG_TIMEOUT_MS = 2_000;

const RECONNECT_TIMEOUT_MS = 5_000;
const MIN_RECONNECT_TIMEOUT_MS = 1_000;
const MAX_RECONNECT_TIMEOUT_MS = 60_000;

const ORIGIN_INITIALIZED = "$initialized";
const ORIGIN_STORAGE_UPDATED = "$storageUpdated";

declare global {
    // eslint-disable-next-line no-var
    var process: {
        env: {
            [key: string]: string | undefined;
        };
    };
}

export const DEFAULT_PLUV_CLIENT_ADDON = <
    TIO extends IOLike,
    TMetadata extends JsonObject,
    TPresence extends JsonObject,
    TCrdt extends AbstractCrdtDocFactory<any>,
>(
    input: PluvRoomAddonInput<TIO, TMetadata, TPresence, TCrdt>,
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
    onError: () => void;
    onMessage: (message: MessageEvent<string>) => void;
    onOpen: () => void;
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

export type RoomEndpoints<TIO extends IOLike<any, any>, TMetadata extends JsonObject> = {
    wsEndpoint?: WsEndpoint<TMetadata>;
} & (InferIOAuthorizeUser<InferIOAuthorize<TIO>> extends BaseUser
    ? { authEndpoint: AuthEndpoint<TMetadata> }
    : { authEndpoint?: undefined });

interface InternalListeners {
    onAuthorizationFail: (error: Error) => void;
}

export type PluvRoomAddon<
    TIO extends IOLike,
    TMetadata extends JsonObject,
    TPresence extends JsonObject,
    TCrdt extends AbstractCrdtDocFactory<any>,
> = (input: PluvRoomAddonInput<TIO, TMetadata, TPresence, TCrdt>) => Partial<PluvRoomAddonResult>;

export interface PluvRoomAddonInput<
    TIO extends IOLike,
    TMetadata extends JsonObject,
    TPresence extends JsonObject,
    TCrdt extends AbstractCrdtDocFactory<any>,
> {
    room: PluvRoom<TIO, TMetadata, TPresence, TCrdt>;
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

export type RoomConfig<
    TIO extends IOLike,
    TMetadata extends JsonObject,
    TPresence extends JsonObject,
    TCrdt extends AbstractCrdtDocFactory<any>,
    TEvents extends PluvRouterEventConfig<TIO, TPresence, InferStorage<TCrdt>>,
> = Id<
    {
        addons?: readonly PluvRoomAddon<TIO, TMetadata, TPresence, TCrdt>[];
        debug?: boolean | PluvRoomDebug<TIO>;
        limits: PluvClientLimits;
        onAuthorizationFail?: (error: Error) => void;
        metadata?: InputZodLike<TMetadata>;
        publicKey?: PublicKey<TMetadata>;
        reconnectTimeoutMs?: ReconnectTimeoutMs;
        router?: PluvRouter<TIO, TPresence, InferStorage<TCrdt>, TEvents>;
    } & RoomEndpoints<TIO, TMetadata> &
        Pick<CrdtManagerOptions<TCrdt>, "initialStorage"> &
        UsersManagerConfig<TPresence>
>;

export class PluvRoom<
    TIO extends IOLike<any, any>,
    TMetadata extends JsonObject = {},
    TPresence extends JsonObject = {},
    TCrdt extends AbstractCrdtDocFactory<any> = NoopCrdtDocFactory,
    TEvents extends PluvRouterEventConfig<TIO, TPresence, InferStorage<TCrdt>> = {},
> implements RoomLike<TIO, TPresence, InferStorage<TCrdt>>
{
    readonly _endpoints: RoomEndpoints<TIO, TMetadata>;

    public readonly id: string;
    public readonly metadata?: InputZodLike<TMetadata>;

    private readonly _crdtManager: CrdtManager<TCrdt>;
    private readonly _crdtNotifier = new CrdtNotifier<InferStorage<TCrdt>>();
    private readonly _debug: boolean | PluvRoomDebug<TIO>;
    private readonly _eventNotifier = new EventNotifier<MergeEvents<TEvents, TIO>>();
    private readonly _intervals: IntervalIds = {
        heartbeat: null,
    };
    private readonly _limits: PluvClientLimits;
    private readonly _listeners: InternalListeners;
    private readonly _publicKey: PublicKey<TMetadata> | null = null;
    private readonly _reconnectTimeoutMs: ReconnectTimeoutMs;
    private readonly _router: PluvRouter<TIO, TPresence, InferStorage<TCrdt>, TEvents>;
    private readonly _stateNotifier = new StateNotifier<TIO, TPresence>();
    private readonly _storageStore: AbstractStorageStore;
    private readonly _subscriptions: InternalSubscriptions = {
        observeCrdt: null,
    };
    private readonly _timeouts: TimeoutIds = {
        pong: null,
        reconnect: null,
    };
    private readonly _usersManager: UsersManager<TIO, TPresence>;
    private readonly _usersNotifier = new UsersNotifier<TIO, TPresence>();

    private _lastMetadata: TMetadata | null = null;
    private _state: WebSocketState<TIO> = {
        authorization: {
            token: null,
            user: null,
        },
        connection: {
            attempts: 0,
            count: 0,
            id: null,
            state: ConnectionState.Untouched,
        },
        webSocket: null,
    };
    private _windowListeners: WindowListeners | null = null;
    private _wsListeners: WebSocketListeners | null = null;

    constructor(room: string, options: RoomConfig<TIO, TMetadata, TPresence, TCrdt, TEvents>) {
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
        this._endpoints = { authEndpoint, wsEndpoint } as RoomEndpoints<TIO, TMetadata>;
        this._limits = limits;
        this._reconnectTimeoutMs = reconnectTimeoutMs;

        if (!!publicKey) this._publicKey = publicKey;

        this._listeners = {
            onAuthorizationFail: (error) => {
                onAuthorizationFail?.(error);
            },
        };

        this._router =
            router ??
            (new PluvRouter({}) as PluvRouter<TIO, TPresence, InferStorage<TCrdt>, TEvents>);
        this._usersManager = new UsersManager<TIO, TPresence>({
            initialPresence,
            limits: this._limits,
            presence,
        });
        this._crdtManager = new CrdtManager<TCrdt>({ initialStorage });
    }

    public get storageLoaded(): boolean {
        return this._crdtManager.initialized;
    }

    public get webSocket(): WebSocket | null {
        return this._state.webSocket;
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
                this._sendMessage({ data, type });

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
                this._sendMessage({ data: _data, type: _type });
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

    public async connect(...args: RoomConnectParams<TMetadata>): Promise<void> {
        const params = (args[0] ?? {}) as WithMetadata<TMetadata>;
        const metadata = params.metadata as TMetadata;

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
            oldState.webSocket = null;

            return oldState;
        });

        await this._storageStore.destroy();
        this._crdtManager.destroy();
        this._stateNotifier.subjects["my-presence"].next(null);
    }

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

    public getDoc = (): CrdtDocLike<InferStorage<TCrdt>> => {
        return this._crdtManager.doc;
    };

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

        const sharedType = this._crdtManager.get(type);

        if (typeof sharedType === "undefined") return null;

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

    public storage = <TKey extends keyof InferStorage<TCrdt>>(
        key: TKey,
        fn: (value: InferCrdtJson<InferStorage<TCrdt>[TKey]>) => void,
    ): (() => void) => {
        return this._crdtNotifier.subscribe(key, fn);
    };

    public storageRoot = (
        fn: (value: {
            [P in keyof InferStorage<TCrdt>]: InferCrdtJson<InferStorage<TCrdt>[P]>;
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

    public transact = (fn: (storage: InferStorage<TCrdt>) => void, origin?: string): void => {
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

    public updateMyPresence = (presence: UpdateMyPresenceAction<TPresence>): void => {
        const newPresence =
            typeof presence === "function" ? presence(this.getMyPresence()) : presence;

        this._usersManager.updateMyPresence(newPresence);

        const myPresence = this._usersManager.myPresence;
        const myself = this._usersManager.myself ?? null;

        this._stateNotifier.subjects["my-presence"].next(myPresence);
        if (!!myself) this._stateNotifier.subjects.myself.next(myself);

        this.broadcast(
            "$updatePresence" as keyof InferIOInput<MergeEvents<TEvents, TIO>>,
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

                return { ...acc, [prop]: serialized };
            },
            {} as { [P in keyof InferStorage<TCrdt>]: InferCrdtJson<InferStorage<TCrdt>[P]> },
        );

        this._crdtNotifier.rootSubject.next(storageRoot);
    }

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

    private _getAddon = (
        addons: readonly PluvRoomAddon<TIO, TMetadata, TPresence, TCrdt>[],
    ): PluvRoomAddon<TIO, TMetadata, TPresence, TCrdt> => {
        return addons.reduce<PluvRoomAddon<TIO, TMetadata, TPresence, TCrdt>>(
            (acc, addon) => () => ({
                ...acc({ room: this }),
                ...addon({ room: this }),
            }),
            DEFAULT_PLUV_CLIENT_ADDON,
        );
    };

    private _getAuthFetchOptions(
        room: string,
        params: GetAuthEndpointParams<TMetadata>,
    ): FetchOptions | null {
        const metadata = params.metadata as TMetadata;

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
        params: GetAuthEndpointParams<TMetadata>,
    ): Promise<string | null> {
        const fetchOptions = this._getAuthFetchOptions(room, params);

        if (!fetchOptions) return null;

        const { url, options } = fetchOptions;
        const res = await fetch(url, options);

        if (!res.ok || res.status !== 200) throw new Error("Room is unauthorized");

        try {
            return await res.text().then((text) => text.trim());
        } catch (err) {
            throw new Error(err instanceof Error ? err.message : "Room is unauthorized");
        }
    }

    private _getPublicKey(params: GetPublickKeyParams<TMetadata>): string | null {
        const metadata = params.metadata as TMetadata;

        if (!this._publicKey) return null;
        if (typeof this._publicKey === "string") return this._publicKey;

        return this._publicKey({ metadata });
    }

    private _getWsEndpoint(room: string, params: GetWsEndpointParams<TMetadata>): string {
        const metadata = params.metadata as TMetadata;

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

    private _handleExit(message: IOEventMessage<TIO>): void {
        const { connectionId } = message;

        if (!connectionId) return;
        // Should not reach here
        if (!this._state.webSocket) throw new Error("Could not find WebSocket");

        const clientId = this._usersManager.getClientId(connectionId);
        const deleted = this._usersManager.deleteConnection(connectionId);
        const others = this._usersManager.getOthers();

        this._stateNotifier.subjects.others.next(others);

        // Should not reach here
        if (!deleted) {
            console.warn("Could not identify exited connection");
            return;
        }

        const { data: user, remaining } = deleted;

        this._usersNotifier.others.next({
            others,
            event: { kind: "leave", user },
        });

        /**
         * @description A single user can have multiple connections. So we're checking that
         * there isn't a remaining connection before choosing to delete that user for other
         * connected participants.
         * @date April 16, 2025
         */
        if (!remaining && !!clientId) this._usersNotifier.delete(clientId);
    }

    private _handlePresenceUpdatedMessage(message: IOEventMessage<TIO>): void {
        const { connectionId } = message;

        if (!connectionId) return;
        // Should not reach here
        if (!this._state.webSocket) throw new Error("Could not find WebSocket");

        const data = message.data as BaseIOEventRecord<InferIOAuthorize<TIO>>["$presenceUpdated"];
        const myself = this._usersManager.myself ?? null;

        /**
         * !HACK
         * @description We're going to have the user's own presence be patched only via local calls
         * to this.updateMyPresence. So we'll not update the user's presence in this handler to
         * avoid weird update delays to the user's own presence.
         *
         * However, we will patch the user's own presence if the user has updated their own
         * presence via another connection that is not this one (e.g. if the user has opened
         * another connection in another browser tab/window somewhere).
         * @date April 2, 2025
         */
        if (myself?.connectionId === connectionId) return;

        const updated = this._usersManager.patchPresence(connectionId, data.presence as TPresence);
        const myClientId = !!myself ? this._usersManager.getClientId(myself) : null;
        const clientId = this._usersManager.getClientId(connectionId);

        if (!!clientId && myClientId === clientId) {
            this._stateNotifier.subjects["my-presence"].next(updated);
            this._stateNotifier.subjects.myself.next(this._usersManager.myself);

            return;
        }

        if (!!clientId) {
            const other = this._usersManager.getOther(connectionId);

            this._usersNotifier.other(clientId).next(other);
        } else {
            /**
             * !HACK
             * @description User could not be found. Add the connection to keep others up-to-date
             * @date April 19, 2025
             */
            const added = this._usersManager.addConnection({
                connectionId,
                presence: data.presence as TPresence,
                user: message.user as Id<InferIOAuthorizeUser<InferIOAuthorize<TIO>>>,
            });
            const other = this._usersManager.getOther(connectionId);

            this._usersNotifier.other(added.clientId).next(other);
        }

        const others = this._usersManager.getOthers();

        this._stateNotifier.subjects.others.next(others);
    }

    private _handleReceiveOthers(message: IOEventMessage<TIO>): void {
        if (!message.connectionId) return;
        // Should not reach here
        if (!this._state.webSocket) throw new Error("Could not find WebSocket");

        const data = message.data as BaseIOEventRecord<InferIOAuthorize<TIO>>["$othersReceived"];

        Object.keys(data.others).forEach((connectionId) => {
            const { presence, user } = data.others[connectionId];

            const result = this._usersManager.addConnection({
                connectionId,
                presence: presence as TPresence,
                user,
            });

            if (!!presence) this._usersManager.patchPresence(connectionId, presence as TPresence);
            if (result.isMyself) return;

            const clientId = result.clientId;
            const other = this._usersManager.getOther(connectionId);

            this._usersNotifier.other(clientId).next(other);
        });

        const others = this._usersManager.getOthers();

        this._stateNotifier.subjects.others.next(others);
        this._usersNotifier.others.next({
            others,
            event: { kind: "sync", users: others },
        });
    }

    private async _handleRegisteredMessage(message: IOEventMessage<TIO>): Promise<void> {
        const { connectionId } = message;
        const user = message.user as Id<InferIOAuthorizeUser<InferIOAuthorize<TIO>>>;

        if (!connectionId) return;
        // Should not reach here
        if (!this._state.webSocket) throw new Error("Could not find WebSocket");

        const data = message.data as BaseIOEventRecord<InferIOAuthorize<TIO>>["$registered"];
        const state = data.state;

        this._updateState((oldState) => {
            oldState.connection.count += 1;
            oldState.connection.id = connectionId;
            oldState.authorization.user = user ?? null;

            return oldState;
        });

        const userInfo: OptionalProps<UserInfo<TIO, TPresence>, "presence"> = {
            connectionId,
            presence: (data.presence as TPresence | null) ?? undefined,
            user,
        };
        this._usersManager.setMyself(userInfo);

        const presence = this._usersManager.myPresence;
        const myself = this._usersManager.myself ?? null;

        this._stateNotifier.subjects["my-presence"].next(presence);
        this._stateNotifier.subjects.myself.next(myself);

        const update = !state
            ? (this._crdtManager.resolveEncodedState(await this._storageStore.getUpdates()) ??
              this._crdtManager.getInitialState())
            : this._crdtManager.getInitialState();

        this._sendMessage({
            type: "$initializeSession",
            data: { presence, update },
        });
    }

    private async _handleStorageReceivedMessage(message: IOEventMessage<TIO>): Promise<void> {
        const { connectionId } = message;

        if (!connectionId) return;
        // Should not reach here
        if (!this._state.webSocket) throw new Error("Could not find WebSocket");

        const data = message.data as BaseIOEventRecord<InferIOAuthorize<TIO>>["$storageReceived"];
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

        this._emitSharedTypes();
        this._observeCrdt();
        this._stateNotifier.subjects["storage-loaded"].next(true);

        this._sendMessage({
            type: "$updateStorage",
            data: { origin, update: encodedState },
        });
    }

    private _handleStorageUpdatedMessage(message: IOEventMessage<TIO>): void {
        const { connectionId } = message;

        if (!connectionId) return;
        // Should not reach here
        if (!this._state.webSocket) throw new Error("Could not find WebSocket");

        const data = message.data as BaseIOEventRecord<
            InferIOAuthorize<TIO>
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

                return { ...acc, [prop]: serialized };
            },
            {} as {
                [P in keyof InferStorage<TCrdt>]: InferCrdtJson<InferStorage<TCrdt>[P]>;
            },
        );

        this._crdtNotifier.rootSubject.next(storageRoot);
    }

    private _handleSyncStateReceived(message: IOEventMessage<TIO>): void {
        const { connectionId } = message;

        if (!connectionId) return;
        // Should not reach here
        if (!this._state.webSocket) throw new Error("Could not find WebSocket");
        if (!this._usersManager.myself) return;

        const data = message.data as BaseIOEventRecord<InferIOAuthorize<TIO>>["$syncStateReceived"];
        const active = new Set(data?.connectionIds ?? []);

        const quitters = this._usersManager
            .getOthers()
            .filter((other) => !active.has(other.connectionId));

        quitters.forEach((quitter) => {
            this._usersManager.deleteConnection(quitter.connectionId);

            const remaining = this._usersManager.getOthers();

            this._usersNotifier.others.next({
                others: remaining,
                event: { kind: "leave", user: quitter },
            });
        });

        const remaining = this._usersManager.getOthers();

        this._stateNotifier.subjects.others.next(remaining);
    }

    private _handleUserJoinedMessage(message: IOEventMessage<TIO>): void {
        const { connectionId } = message;

        if (!connectionId) return;
        // Should not reach here
        if (!this._state.webSocket) throw new Error("Could not find WebSocket");
        if (!this._usersManager.myself) return;

        const data = message.data as BaseIOEventRecord<InferIOAuthorize<TIO>>["$userJoined"];
        const myself = this._usersManager.myself;

        if (myself.connectionId === connectionId) {
            this._sendMessage({ type: "$getOthers", data: {} });
            return;
        }

        const added = this._usersManager.addConnection({
            connectionId,
            presence: data.presence as TPresence,
            user: data.user,
        });

        const other = this._usersManager.getOther(connectionId);
        const others = this._usersManager.getOthers();

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

            if (!this._state.webSocket) return;
            if (!this._state.connection.id) return;
            if (this._state.webSocket.readyState !== WebSocket.OPEN) return;

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

            return oldState;
        });
    }

    private async _onClose(event: CloseEvent): Promise<void> {
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
    private _onError(): void {}

    private _onMessage(event: MessageEvent<string>): void {
        const message = this._parseMessage(event);

        if (!message) return;

        const shouldLog =
            typeof this._debug === "boolean"
                ? this._debug
                : this._debug.output.find((value) => value === message.type);

        if (shouldLog) {
            this._logDebug("WebSocket event received: ", message.type, message);
        }

        this._eventNotifier.subject(message.type as keyof InferIOOutput<TIO>).next(message as any);

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
            default:
        }
    }

    private _onOpen(): void {
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

    private _parseMessage(message: { data: string | ArrayBuffer }): IOEventMessage<TIO> | null {
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

            return config as IOEventMessage<TIO>;
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
        const params = (
            typeof metadata === "undefined" ? [] : [{ metadata }]
        ) as RoomConnectParams<TMetadata>;

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

    private _setMetadata(metadata: TMetadata): TMetadata {
        const parsed = this.metadata ? this.metadata.parse(metadata) : metadata;

        this._lastMetadata = parsed;

        return parsed;
    }

    private _updateState(
        updater: (oldState: WebSocketState<TIO>) => WebSocketState<TIO>,
    ): WebSocketState<TIO> {
        let authorization: AuthorizationState<TIO>;

        try {
            authorization = JSON.parse(JSON.stringify(this._state.authorization));
        } catch {
            throw new Error("User is not JSON serializable");
        }

        const oldState: WebSocketState<TIO> = {
            ...this._state,
            authorization,
            connection: JSON.parse(JSON.stringify(this._state.connection)),
            webSocket: this._state.webSocket,
        };

        const newState = updater(oldState);
        this._state = newState;

        this._logDebug("WebSocket new state: ", newState);
        this._stateNotifier.subjects.connection.next(newState);

        return newState;
    }
}
