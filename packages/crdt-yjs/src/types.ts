import type { CrdtType } from "@pluv/crdt";

export type YjsType<TValue extends unknown, TJson extends unknown = any> = CrdtType<
    TValue,
    TJson
> & {
    initialValue?: any;
    toJSON: () => any;
};

/**
 * @description Type internally defined by Yjs.Awareness
 * @see https://github.com/yjs/y-protocols/blob/master/awareness.js
 */
export interface YjsAwarenessUpdate {
    added: number[];
    updated: number[];
    removed: number[];
}

export type YjsProviderStatus = "connecting" | "connected" | "disconnected";

/**
 * @description Type internally defined by Yjs.Awareness
 * @see https://github.com/yjs/y-protocols/blob/master/awareness.js
 */
export interface MetaClientState {
    clock: number;
    lastUpdated: number;
}

export type AwarenessPresence<
    TPresence extends Record<string, any>,
    TField extends keyof TPresence | null,
> = TField extends null ? TPresence : TField extends keyof TPresence ? TPresence[TField] : never;
