import type { JsonObject } from "@pluv/types";
import { AbstractWebSocket } from "./AbstractWebSocket";
import { PING_TIMEOUT_MS } from "./constants";
import type { IODefs } from "./IODefs";
import type { WebSocketSession, WebSocketType } from "./types";

export interface PatchPresenceParams {
    presence: JsonObject | null;
    seq?: number | null;
    sessionId: string;
}

export interface RoomSessionsConfig<T extends IODefs = IODefs> {
    platform: T["platform"];
}

export class RoomSessions<T extends IODefs = IODefs> {
    private readonly _platform: T["platform"];
    private readonly _sessions = new Map<[sessionId: string][0], AbstractWebSocket>();
    private readonly _userSessions = new Map<[userId: string][0], Set<[sessionId: string][0]>>();

    constructor(config: RoomSessionsConfig<T>) {
        this._platform = config.platform;
    }

    public all(): ReadonlyMap<string, AbstractWebSocket> {
        return this._sessions;
    }

    public addUserSession(userId: string, sessionId: string): Set<[sessionId: string][0]> {
        const set = this._userSessions.get(userId) ?? new Set<string>();
        const updated = set.add(sessionId);

        this._userSessions.set(userId, updated);

        return updated;
    }

    public delete(sessionId: string): boolean {
        return this._sessions.delete(sessionId);
    }

    public deleteConnection(sessionId: string): AbstractWebSocket | null {
        const webSocket = this._sessions.get(sessionId) ?? null;

        if (!webSocket) return null;

        webSocket.state = { ...webSocket.state, quit: true };
        this._sessions.delete(sessionId);

        return webSocket;
    }

    public get(sessionId: string): AbstractWebSocket | undefined {
        return this._sessions.get(sessionId);
    }

    public getLatestPresence(userId: string): {
        presence: JsonObject | null;
        seq: number | null;
    } {
        const sessionIds = Array.from(this._userSessions.get(userId)?.values() ?? []);

        if (!sessionIds.length) return { presence: null, seq: null };

        return sessionIds.reduce(
            (state, sessionId) => {
                const pluvWs = this._sessions.get(sessionId) ?? null;

                if (!pluvWs) return state;

                const session = pluvWs.session;
                const presence = session.presence;
                const seq = session.seq.presence;

                if (session.user.id !== userId) return state;
                if (typeof state.seq !== "number") return { presence, seq };
                if (typeof seq !== "number") return state;

                return seq > state.seq ? { presence, seq } : state;
            },
            { presence: null, seq: null } as {
                presence: JsonObject | null;
                seq: number | null;
            },
        );
    }

    public getQuitters(): readonly AbstractWebSocket[] {
        const currentTime = new Date().getTime();

        return Array.from(this._sessions.values()).filter(
            (pluvWs) => !this._isLive(pluvWs, currentTime),
        );
    }

    public getSession(webSocket: WebSocketType<T["platform"]>): WebSocketSession<T> {
        const pluvWs = this.resolve(webSocket);

        if (!pluvWs) throw new Error("Session could not be found");

        return this.toSession(pluvWs);
    }

    public getSessions(): readonly WebSocketSession<T>[] {
        return Array.from(this._sessions.values()).map((pluvWs) => this.toSession(pluvWs));
    }

    public getLiveSessions(currentTime: number = Date.now()): readonly WebSocketSession<T>[] {
        return Array.from(this._sessions.values())
            .filter((pluvWs) => this._isLive(pluvWs, currentTime))
            .map((pluvWs) => this.toSession(pluvWs));
    }

    public getSize(): number {
        const currentTime = new Date().getTime();

        /**
         * @description Doing this instead of .size because some sessions
         * in the map can be considered as "omitted".
         * @date December 21, 2022
         */
        return Array.from(this._sessions.values()).reduce((count, pluvWs) => {
            return this._isLive(pluvWs, currentTime) ? count + 1 : count;
        }, 0);
    }

    public has(sessionId: string): boolean {
        return this._sessions.has(sessionId);
    }

    public removeUserSession(
        userId: string,
        sessionId: string,
    ): Set<[sessionId: string][0]> | null {
        const set = this._userSessions.get(userId);

        if (!set) return null;

        set.delete(sessionId);

        if (!!set.size) return set;

        this._userSessions.delete(userId);

        return set;
    }

    public resolve(webSocket: WebSocketType<T["platform"]>): AbstractWebSocket | null {
        if ((webSocket as unknown as any) instanceof AbstractWebSocket) return webSocket;

        const sessionId = this._platform.getSessionId(webSocket);

        if (typeof sessionId === "string") {
            const session = this._sessions.get(sessionId) ?? null;

            if (session) return session;
        }

        const sessions = Array.from(this._sessions.values());

        return sessions.find((pluvWs) => pluvWs.webSocket === webSocket) ?? null;
    }

    public set(sessionId: string, webSocket: AbstractWebSocket): this {
        this._sessions.set(sessionId, webSocket);

        return this;
    }

    public setPresence(params: PatchPresenceParams): void {
        const { presence, seq: requested, sessionId } = params;
        const pluvWs = this._sessions.get(sessionId) ?? null;

        if (!pluvWs) return;

        const wsSession = pluvWs.session;
        const user = wsSession.user;
        const sessionIds = user
            ? new Set<string>([...(this._userSessions.get(user.id) ?? []), sessionId])
            : new Set([sessionId]);
        const currentMax = Array.from(sessionIds).reduce<number | null>((max, sId) => {
            const seq = this._sessions.get(sId)?.session.seq.presence ?? null;

            if (typeof seq !== "number") return max;
            if (typeof max !== "number") return seq;

            return seq > max ? seq : max;
        }, null);
        const next =
            typeof requested === "number"
                ? requested
                : typeof currentMax === "number"
                  ? currentMax + 1
                  : 1;

        sessionIds.forEach((sId) => {
            const session = this._sessions.get(sId)?.session;

            if (!session) return;

            const prevState = session.webSocket.state;

            this._platform.setSerializedState(session.webSocket, {
                ...prevState,
                presence,
                seq: {
                    ...prevState.seq,
                    presence: next,
                },
            });
        });
    }

    public toSession(pluvWs: AbstractWebSocket): WebSocketSession<T> {
        return pluvWs.session as WebSocketSession<T>;
    }

    public values(): IterableIterator<AbstractWebSocket> {
        return this._sessions.values();
    }

    private _isLive(pluvWs: AbstractWebSocket, currentTime: number): boolean {
        if (pluvWs.state.quit) return false;

        const pingTime = this._platform.getLastPing(pluvWs) ?? pluvWs.state.timers.ping;

        return currentTime - pingTime <= PING_TIMEOUT_MS;
    }
}
