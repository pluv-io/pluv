import { InferYjsSharedTypeJson } from "@pluv/crdt-yjs";
import type {
    BaseIOEventRecord,
    EventMessage,
    Id,
    InferIOAuthorize,
    InferIOAuthorizeRequired,
    InferIOAuthorizeUser,
    InferIOInput,
    InferIOOutput,
    IOEventMessage,
    IOLike,
    JsonObject,
} from "@pluv/types";
import type { AbstractType } from "yjs";
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
import type {
    AuthorizationState,
    InternalSubscriptions,
    UserInfo,
    WebSocketConnection,
    WebSocketState,
} from "./types";
import { ConnectionState } from "./types";
import type { UsersManagerConfig } from "./UsersManager";
import { UsersManager } from "./UsersManager";

const HEARTBEAT_INTERVAL_MS = 10_000;
const PONG_TIMEOUT_MS = 2_000;
const RECONNECT_TIMEOUT_MS = 30_000;

declare global {
    var process: {
        env: {
            [key: string]: string | undefined;
        };
    };
}

interface WindowListeners {
    onNavigatorOnline: () => void;
    onVisibilityChange: () => void;
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

export type AuthEndpoint =
    | string
    | ((room: string) => string | FetchOptions)
    | true;
export type WsEndpoint = string | ((room: string) => string);

type FetchOptions = { url: string; options?: RequestInit };

export type RoomEndpoints<TIO extends IOLike> = {
    wsEndpoint?: WsEndpoint;
} & (InferIOAuthorizeRequired<InferIOAuthorize<TIO>> extends true
    ? { authEndpoint: AuthEndpoint }
    : { authEndpoint?: undefined });

interface InternalListeners {
    onAuthorizationFail: (error: Error) => void;
}

export type PluvRoomDebug<TIO extends IOLike> = Id<{
    output: readonly (keyof InferIOOutput<TIO>)[];
    input: readonly (keyof InferIOInput<TIO>)[];
}>;

export type PluvRoomOptions<
    TIO extends IOLike,
    TPresence extends JsonObject = {},
    TStorage extends Record<string, AbstractType<any>> = {}
> = {
    debug?: boolean | PluvRoomDebug<TIO>;
    onAuthorizationFail?: (error: Error) => void;
} & Omit<CrdtManagerOptions<TStorage>, "encodedState"> &
    UsersManagerConfig<TPresence>;

export type RoomConfig<
    TIO extends IOLike,
    TPresence extends JsonObject = {},
    TStorage extends Record<string, AbstractType<any>> = {}
> = RoomEndpoints<TIO> & PluvRoomOptions<TIO, TPresence, TStorage>;

export class PluvRoom<
    TIO extends IOLike,
    TPresence extends JsonObject = {},
    TStorage extends Record<string, AbstractType<any>> = {}
> extends AbstractRoom<TIO, TPresence, TStorage> {
    readonly _endpoints: RoomEndpoints<TIO>;

    private _crdtManager: CrdtManager<TStorage> | null = null;
    private _crdtNotifier = new CrdtNotifier<TStorage>();
    private _debug: boolean | PluvRoomDebug<TIO>;
    private _eventNotifier = new EventNotifier<TIO>();
    private _initialStorage: (() => TStorage) | null = null;
    private _intervals: IntervalIds = {
        heartbeat: null,
    };
    private _listeners: InternalListeners;
    private _otherNotifier = new OtherNotifier<TIO>();
    private _state: WebSocketState<TIO> = {
        authorization: {
            token: null,
            user: null,
        },
        connection: {
            count: 0,
            id: null,
            state: ConnectionState.Untouched,
        },
        webSocket: null,
    };
    private _stateNotifier = new StateNotifier<TIO, TPresence>();
    private _subscriptions: InternalSubscriptions = {
        observeCrdt: null,
    };
    private _timeouts: TimeoutIds = {
        pong: null,
        reconnect: null,
    };
    private _windowListeners: WindowListeners | null = null;
    private _wsListeners: WebSocketListeners | null = null;
    private _usersManager: UsersManager<TIO, TPresence>;

    constructor(room: string, options: RoomConfig<TIO, TPresence, TStorage>) {
        const {
            authEndpoint,
            debug = false,
            initialPresence,
            initialStorage,
            onAuthorizationFail,
            presence,
            wsEndpoint,
        } = options;

        super(room);

        this._debug = debug;

        this._endpoints = { authEndpoint, wsEndpoint } as RoomEndpoints<TIO>;

        this._listeners = {
            onAuthorizationFail: (error) => {
                this._clearTimeout(this._timeouts.reconnect);
                this._timeouts.reconnect = setTimeout(
                    this._reconnect.bind(this),
                    RECONNECT_TIMEOUT_MS
                );

                onAuthorizationFail?.(error);
            },
        };

        this._usersManager = new UsersManager<TIO, TPresence>({
            initialPresence,
            presence,
        });

        if (initialStorage) this._initialStorage = initialStorage;
    }

    public get webSocket(): WebSocket | null {
        return this._state.webSocket;
    }

    public broadcast<TEvent extends keyof InferIOInput<TIO>>(
        event: TEvent,
        data: Id<InferIOInput<TIO>[TEvent]>
    ): void {
        if (!this._state.webSocket) return;
        if (this._state.connection.state !== ConnectionState.Open) return;

        const type = event.toString();

        this._sendMessage({ data, type });
    }

    public async connect(): Promise<void> {
        if (!this._endpoints.wsEndpoint) {
            throw new Error("Must provide an wsEndpoint.");
        }

        const canConnect = [
            ConnectionState.Closed,
            ConnectionState.Untouched,
        ].some((state) => this._state.connection.state === state);

        if (!canConnect) return;

        this._clearTimeout(this._timeouts.reconnect);

        this._updateState((oldState) => {
            oldState.connection.state = ConnectionState.Connecting;

            return oldState;
        });

        const url = new URL(this._getWsEndpoint(this.id));

        let authToken: string | null = null;

        try {
            authToken = await this._getAuthorization(this.id);
        } catch (err) {
            this._onAuthorizationFail(err);

            return;
        }

        authToken &&
            url.searchParams.set("token", encodeURIComponent(authToken));

        let webSocket: WebSocket;

        try {
            webSocket = new WebSocket(url.toString());
        } catch (err) {
            this._onAuthorizationFail(err);

            return;
        }

        this._updateState((oldState) => {
            oldState.authorization.token = authToken;
            oldState.webSocket = webSocket;

            return oldState;
        });

        this._attachWindowListeners();
        this._attachWsListeners();
    }

    public disconnect(): void {
        if (!this._endpoints.wsEndpoint) {
            throw new Error("Must provide an wsEndpoint.");
        }

        if (!this._state.webSocket) return;

        const canDisconnect = [
            ConnectionState.Connecting,
            ConnectionState.Open,
        ].some((state) => this._state.connection.state === state);

        if (!canDisconnect) return;

        this._clearInterval(this._intervals.heartbeat);

        this._closeWs();
        this._crdtManager?.destroy();

        this._stateNotifier.subjects["my-presence"].next(null);

        this._updateState((oldState) => {
            oldState.authorization.token = null;
            oldState.connection.state = ConnectionState.Closed;
            oldState.webSocket = null;

            return oldState;
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

    public getMyPresence = (): TPresence | null => {
        return this._usersManager.myself?.presence ?? null;
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

        this.broadcast(
            "$UPDATE_PRESENCE" as keyof InferIOInput<TIO>,
            { presence } as any
        );
    };

    private _attachWindowListeners(): void {
        if (typeof window === "undefined") return;
        if (typeof document === "undefined") return;

        this._windowListeners = {
            onNavigatorOnline: this._onNavigatorOnline.bind(this),
            onVisibilityChange: this._onVisibilityChange.bind(this),
        };

        window.addEventListener(
            "online",
            this._windowListeners.onNavigatorOnline
        );
        document.addEventListener(
            "visibilitychange",
            this._windowListeners.onVisibilityChange
        );
    }

    private _attachWsListeners(): void {
        if (!this._state.webSocket) return;

        this._wsListeners = {
            onClose: this._onClose.bind(this),
            onError: this._onError.bind(this),
            onMessage: this._onMessage.bind(this),
            onOpen: this._onOpen.bind(this),
        };

        this._state.webSocket.addEventListener(
            "close",
            this._wsListeners.onClose
        );
        this._state.webSocket.addEventListener(
            "error",
            this._wsListeners.onError
        );
        this._state.webSocket.addEventListener(
            "message",
            this._wsListeners.onMessage
        );
        this._state.webSocket.addEventListener(
            "open",
            this._wsListeners.onOpen
        );
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
        if (!this._state.webSocket) return;

        this._subscriptions.observeCrdt?.();

        this._clearTimeout(this._timeouts.pong);
        this._clearTimeout(this._timeouts.reconnect);

        this._detachWindowListeners();
        this._usersManager.removeMyself();

        const canClose = [WebSocket.CONNECTING, WebSocket.OPEN].some(
            (readyState) => readyState === this._state.webSocket?.readyState
        );

        if (canClose) this._state.webSocket.close();

        this._detachWsListeners();

        this._stateNotifier.subjects["myself"].next(null);
    }

    private _detachWindowListeners(): void {
        if (!this._windowListeners) return;
        if (typeof window === "undefined") return;
        if (typeof document === "undefined") return;

        window.removeEventListener(
            "online",
            this._windowListeners.onNavigatorOnline
        );
        document.removeEventListener(
            "visibilitychange",
            this._windowListeners.onVisibilityChange
        );

        this._windowListeners = null;
    }

    private _detachWsListeners(): void {
        if (!this._state.webSocket || !this._wsListeners) return;

        this._state.webSocket.removeEventListener(
            "close",
            this._wsListeners.onClose
        );
        this._state.webSocket.removeEventListener(
            "error",
            this._wsListeners.onError
        );
        this._state.webSocket.removeEventListener(
            "message",
            this._wsListeners.onMessage
        );
        this._state.webSocket.removeEventListener(
            "open",
            this._wsListeners.onOpen
        );

        this._wsListeners = null;
    }

    private async _getAuthorization(room: string): Promise<string | null> {
        const fetchOptions = this._getAuthFetchOptions(room);

        if (!fetchOptions) return null;

        const { url, options } = fetchOptions;

        const res = await fetch(url, options);

        if (!res.ok || res.status !== 200) {
            throw new Error("Room is unauthorized");
        }

        try {
            return await res.text().then((text) => text.trim());
        } catch (err) {
            throw new Error(
                err instanceof Error ? err.message : "Room is unauthorized"
            );
        }
    }

    private _getAuthFetchOptions(room: string): FetchOptions | null {
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

        const result = this._endpoints.authEndpoint(room);

        return typeof result === "string"
            ? { url: result, options: {} }
            : result;
    }

    private _getWsEndpoint(room: string): string {
        switch (typeof this._endpoints.wsEndpoint) {
            case "undefined":
                return `/api/pluv/room/${room}`;
            case "string":
                return this._endpoints.wsEndpoint;
            default:
                return this._endpoints.wsEndpoint(room);
        }
    }

    private _handleExit(message: IOEventMessage<TIO>): void {
        const { connectionId } = message;

        if (!connectionId) return;
        // Should not reach here
        if (!this._state.webSocket) throw new Error("Could not find WebSocket");

        this._usersManager.removeUser(connectionId);

        const others = this._usersManager.getOthers();

        this._stateNotifier.subjects.others.next(others);
        this._otherNotifier.subject(connectionId).next(null);
        this._otherNotifier.subjects.delete(connectionId);
    }

    private _handlePresenceUpdatedMessage(message: IOEventMessage<TIO>): void {
        const { connectionId } = message;

        if (!connectionId) return;
        // Should not reach here
        if (!this._state.webSocket) throw new Error("Could not find WebSocket");

        const data = message.data as BaseIOEventRecord<
            InferIOAuthorize<TIO>
        >["$PRESENCE_UPDATED"];

        this._usersManager.patchPresence(
            connectionId,
            data.presence as TPresence
        );

        const myPresence = this._usersManager.myPresence;
        const myself = this._usersManager.myself ?? null;

        if (myself?.connectionId === connectionId) {
            this._stateNotifier.subjects["my-presence"].next(myPresence);
            this._stateNotifier.subjects["myself"].next(myself);

            return;
        }

        const other = this._usersManager.getOther(connectionId);
        const others = this._usersManager.getOthers();

        this._otherNotifier.subject(connectionId).next(other);
        this._stateNotifier.subjects["others"].next(others);
    }

    private _handleReceiveOthers(message: IOEventMessage<TIO>): void {
        if (!message.connectionId) return;
        // Should not reach here
        if (!this._state.webSocket) throw new Error("Could not find WebSocket");

        const data = message.data as BaseIOEventRecord<
            InferIOAuthorize<TIO>
        >["$OTHERS_RECEIVED"];

        Object.keys(data.others).forEach((connectionId) => {
            const { presence, user } = data.others[connectionId];

            if (!user) return;

            this._usersManager.setUser(connectionId, user);

            const other = this._usersManager.getOther(connectionId);

            !!presence &&
                this._usersManager.patchPresence(
                    connectionId,
                    presence as TPresence
                );

            this._otherNotifier.subject(connectionId).next(other);
        });

        const others = this._usersManager.getOthers();

        this._stateNotifier.subjects["others"].next(others);
    }

    private _handleRegisteredMessage(message: IOEventMessage<TIO>): void {
        const { connectionId, user } = message;

        if (!connectionId) return;
        // Should not reach here
        if (!this._state.webSocket) throw new Error("Could not find WebSocket");

        this._updateState((oldState) => {
            oldState.connection.count += 1;
            oldState.connection.id = connectionId;
            oldState.authorization.user = user;

            return oldState;
        });

        this._usersManager.setMyself(
            connectionId,
            user as Id<InferIOAuthorizeUser<InferIOAuthorize<TIO>>>
        );

        const presence = this._usersManager.myPresence;
        const myself = this._usersManager.myself ?? null;

        this._stateNotifier.subjects["my-presence"].next(presence);
        this._stateNotifier.subjects["myself"].next(myself);

        const update =
            this._state.connection.count > 1
                ? this._crdtManager?.doc.encodeStateAsUpdate() ?? null
                : null;

        this._sendMessage({
            type: "$INITIALIZE_SESSION",
            data: { presence, update },
        });
    }

    private _handleStorageReceivedMessage(message: IOEventMessage<TIO>): void {
        const { connectionId } = message;

        if (!connectionId) return;
        // Should not reach here
        if (!this._state.webSocket) throw new Error("Could not find WebSocket");

        const data = message.data as BaseIOEventRecord<
            InferIOAuthorize<TIO>
        >["$STORAGE_RECEIVED"];

        this._crdtManager = new CrdtManager<TStorage>({
            encodedState: data.state,
            initialStorage: this._initialStorage ?? undefined,
        });

        this._observeCrdt();

        const sharedTypes = this._crdtManager.doc.getSharedTypes();

        Object.keys(sharedTypes).forEach((key) => {
            const sharedType = sharedTypes[key];
            const serialized = sharedType.toJSON();

            this._crdtNotifier.subject(key).next(serialized);
        });

        const update = this._crdtManager.doc.encodeStateAsUpdate();

        this._sendMessage({
            type: "$UPDATE_STORAGE",
            data: { origin: "$STORAGE_RECEIVED", update },
        });
    }

    private _handleStorageUpdatedMessage(message: IOEventMessage<TIO>): void {
        const { connectionId } = message;

        if (!connectionId) return;
        // Should not reach here
        if (!this._state.webSocket) throw new Error("Could not find WebSocket");

        const data = message.data as BaseIOEventRecord<
            InferIOAuthorize<TIO>
        >["$STORAGE_UPDATED"];

        if (!this._crdtManager) return;

        this._crdtManager.doc.applyUpdate(data.state, "$STORAGE_UPDATED");

        const sharedTypes = this._crdtManager.doc.getSharedTypes();

        Object.keys(sharedTypes).forEach((key) => {
            if (!this._crdtManager) return;

            const sharedType = sharedTypes[key];

            if (!sharedType) return;

            const serialized = sharedType.toJSON();

            this._crdtNotifier.subject(key).next(serialized);
        });
    }

    private _handleUserJoinedMessage(message: IOEventMessage<TIO>): void {
        const { connectionId } = message;

        if (!connectionId) return;
        // Should not reach here
        if (!this._state.webSocket) throw new Error("Could not find WebSocket");
        if (!this._usersManager.myself) return;

        const data = message.data as BaseIOEventRecord<
            InferIOAuthorize<TIO>
        >["$USER_JOINED"];

        const myself = this._usersManager.myself;

        if (myself.connectionId === connectionId) {
            this._sendMessage({ type: "$GET_OTHERS", data: {} });
        }

        this._usersManager.setUser(
            connectionId,
            data.user,
            data.presence as TPresence
        );

        const other = this._usersManager.getOther(connectionId);
        const others = this._usersManager.getOthers();

        this._otherNotifier.subject(connectionId).next(other);
        this._stateNotifier.subjects["others"].next(others);
    }

    private _heartbeat(): void {
        this._clearTimeout(this._timeouts.pong);
        this._timeouts.pong = setTimeout(
            this._reconnect.bind(this),
            PONG_TIMEOUT_MS
        );

        this._sendMessage({ type: "$PING", data: {} });
    }

    private _logDebug(...data: any[]): void {
        // eslint-disable-next-line turbo/no-undeclared-env-vars
        if (process?.env?.NODE_ENV === "production") return;

        this._debug && console.log(...data);
    }

    private _observeCrdt(): void {
        this._subscriptions.observeCrdt?.();

        if (!this._crdtManager) return;

        const unsubscribe = this._crdtManager.doc.subscribe(
            (update, _origin) => {
                const origin = _origin ?? null;

                if (!this._crdtManager) return;
                if (!this._state.webSocket) return;
                if (!this._state.connection.id) return;
                if (this._state.webSocket.readyState !== WebSocket.OPEN) return;

                if (origin === "$STORAGE_UPDATED") return;

                const sharedTypes = this._crdtManager.doc.getSharedTypes();

                Object.entries(sharedTypes).forEach(([prop, sharedType]) => {
                    if (!this._crdtManager) return;

                    const serialized = sharedType.toJSON();

                    this._crdtNotifier.subject(prop).next(serialized);
                });

                this._sendMessage({
                    type: "$UPDATE_STORAGE",
                    data: { origin, update },
                });
            }
        );

        this._subscriptions.observeCrdt = unsubscribe;
    }

    private _onAuthorizationFail(error: unknown): void {
        const authError =
            error instanceof Error ? error : new Error("Authorization failed");

        this._listeners.onAuthorizationFail(authError);

        this._updateState((oldState) => {
            oldState.connection.state = ConnectionState.Unavailable;

            return oldState;
        });
    }

    /**
     * TODO
     * @description Determine if ws was closed with a code for closing without retries.
     * Otherwise, attempt to retry again with incremental backoff
     * @author leedavidcs
     * @date August 19, 2022
     */
    private _onClose(event: CloseEvent): void {
        this._logDebug("WebSocket closed");
        !!event.reason && this._logDebug(event.reason);

        this._clearInterval(this._intervals.heartbeat);
        this._clearTimeout(this._timeouts.pong);

        this._updateState((oldState) => {
            oldState.connection.state = ConnectionState.Closed;
            oldState.webSocket = null;

            return oldState;
        });
    }

    /**
     * TODO
     * @description Handle websocket errors in a meaningful way, should they occur
     * @author leedavidcs
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

        this._eventNotifier
            .subject(message.type as keyof InferIOOutput<TIO>)
            .next(message as any);

        const { connectionId } = message;

        if (!connectionId) return;

        switch (message.type) {
            case "$EXIT": {
                this._handleExit(message);
                return;
            }
            case "$OTHERS_RECEIVED": {
                this._handleReceiveOthers(message);
                return;
            }
            case "$PONG": {
                this._clearTimeout(this._timeouts.pong);
                return;
            }
            case "$PRESENCE_UPDATED": {
                this._handlePresenceUpdatedMessage(message);
                return;
            }
            case "$REGISTERED": {
                this._handleRegisteredMessage(message);
                return;
            }
            case "$STORAGE_RECEIVED": {
                this._handleStorageReceivedMessage(message);
                return;
            }
            case "$STORAGE_UPDATED": {
                this._handleStorageUpdatedMessage(message);
                return;
            }
            case "$USER_JOINED": {
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
            HEARTBEAT_INTERVAL_MS
        );
    }

    private async _onNavigatorOnline(): Promise<void> {
        if (this._state.connection.state !== ConnectionState.Unavailable) {
            return;
        }

        await this._reconnect();
    }

    private async _onVisibilityChange(): Promise<void> {
        if (typeof document === "undefined") return;
        if (document.visibilityState !== "visible") return;

        switch (this._state.connection.state) {
            case ConnectionState.Open:
                this._clearInterval(this._intervals.heartbeat);
                setInterval(this._heartbeat.bind(this), HEARTBEAT_INTERVAL_MS);

                return;
            case ConnectionState.Unavailable:
                await this._reconnect();

                return;
            default:
        }
    }

    private _parseMessage(message: {
        data: string | ArrayBuffer;
    }): IOEventMessage<TIO> | null {
        /**
         * !HACK
         * @description We'll only handle stringified JSONs for now
         * @author leedavidcs
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

    private async _reconnect(): Promise<void> {
        if (!this._endpoints.wsEndpoint) {
            throw new Error("Must provide an wsEndpoint.");
        }

        if (!this._state.webSocket) return;

        this._closeWs();

        this._updateState((oldState) => {
            oldState.authorization.token = null;
            oldState.connection.state = ConnectionState.Closed;
            oldState.webSocket = null;

            return oldState;
        });

        await this.connect();
    }

    private _sendMessage<
        TMessage extends EventMessage<string, any> = EventMessage<string, any>
    >(data: TMessage): void {
        const webSocket = this._state.webSocket;

        if (webSocket?.readyState !== WebSocket.OPEN) return;

        const shouldLog =
            typeof this._debug === "boolean"
                ? this._debug
                : this._debug.input.find((value) => value === data.type);

        if (shouldLog) {
            this._logDebug("WebSocket event sent: ", data.type, data);
        }

        webSocket.send(JSON.stringify(data));
    }

    private _updateState(
        updater: (oldState: WebSocketState<TIO>) => WebSocketState<TIO>
    ): WebSocketState<TIO> {
        let authorization: AuthorizationState<TIO>;

        try {
            authorization = JSON.parse(
                JSON.stringify(this._state.authorization)
            );
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

        this._logDebug("WebSocket new state: ", newState);

        this._state = newState;

        this._stateNotifier.subjects.connection.next(newState);

        return newState;
    }
}
