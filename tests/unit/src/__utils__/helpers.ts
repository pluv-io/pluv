import { loro } from "@pluv/crdt-loro";
import { Doc as YDoc, encodeStateAsUpdate } from "yjs";

export interface Deferred<T> {
    promise: Promise<T>;
    resolve: (value: T) => void;
}

export const deferred = <T = void>(): Deferred<T> => {
    let resolve!: (value: T) => void;

    const promise = new Promise<T>((res) => {
        resolve = res;
    });

    return { promise, resolve };
};

/** Drains pending microtasks, advancing an in-flight teardown to its next suspension point. */
export const tick = async (times: number = 1): Promise<void> => {
    for (let i = 0; i < times; i += 1) {
        await new Promise<void>((resolve) => setTimeout(resolve, 0));
    }
};

export const waitUntil = async (predicate: () => boolean, timeoutMs: number = 5_000) => {
    const start = Date.now();

    while (!predicate()) {
        if (Date.now() - start > timeoutMs) throw new Error("Timed out waiting for condition");

        await tick();
    }
};

export const encodedStateWithContent = (text: string): string => {
    const doc = new YDoc();

    doc.getText("content").insert(0, text);

    return Buffer.from(encodeStateAsUpdate(doc)).toString("base64");
};

export const encodedLoroStateWithContent = (text: string): string => {
    const doc = loro.doc((t) => ({ content: t.text("content", text) })).getInitialized();
    const encodedState = doc.getEncodedState();

    doc.destroy();

    return encodedState;
};

/** Yjs-specific. A pristine Y.Doc encodes to the 2-byte "AAA=" payload that wiped storage. */
export const isEmptyEncodedState = (encodedState: string | null): boolean => {
    if (!encodedState) return true;

    return Buffer.from(encodedState, "base64").byteLength <= 2;
};
