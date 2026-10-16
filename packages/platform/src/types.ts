export type PluvSocket = {
    id: string;
    lastPing: number | null;
};

export type PluvRoomState = {
    storage?: {
        sql?: {
            exec: (...args: unknown[]) => unknown;
        };
    };
    waitUntil?: (promise: Promise<unknown>) => void;
};

export type PluvRoomContext = {
    env?: Record<string, unknown>;
    sessions?: PluvSocket[];
    state?: PluvRoomState;
};

export type PlainError = { message: string } | null;

export type HostCallback<TArgs extends unknown[]> = (...args: TArgs) => void | Promise<void>;
