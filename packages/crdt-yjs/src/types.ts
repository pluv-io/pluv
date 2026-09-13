export type YjsAwarenessUpdate = {
    added: number[];
    updated: number[];
    removed: number[];
};

export type YjsProviderStatus = "connecting" | "connected" | "disconnected";

export interface MetaClientState {
    clock: number;
    lastUpdated: number;
}

export type AwarenessPresence<
    TPresence extends Record<string, any>,
    TField extends keyof TPresence | null,
> = TField extends null ? TPresence : TField extends keyof TPresence ? TPresence[TField] : never;
