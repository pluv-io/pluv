import type { Id, InferIOAuthorize, InferIOAuthorizeUser, IOLike, JsonObject } from "@pluv/types";

export interface AuthorizationState<TIO extends IOLike> {
    token: string | null;
    user: InferIOAuthorizeUser<InferIOAuthorize<TIO>> | null;
}

export enum ConnectionState {
    Closed = "Closed",
    Connecting = "Connecting",
    Open = "Open",
    Unavailable = "Unavailable",
    Untouched = "Untouched",
}

export interface InternalSubscriptions {
    observeCrdt: (() => void) | null;
}

export interface WebSocketConnection {
    count: number;
    id: string | null;
    state: ConnectionState;
}

export interface WebSocketState<TIO extends IOLike> {
    authorization: AuthorizationState<TIO>;
    connection: WebSocketConnection;
    webSocket: WebSocket | null;
}

export interface UserInfo<TIO extends IOLike, TPresence extends JsonObject = {}> {
    connectionId: string;
    presence: TPresence;
    user: Id<InferIOAuthorizeUser<InferIOAuthorize<TIO>>>;
}
