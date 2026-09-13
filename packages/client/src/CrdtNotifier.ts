import type { StorageSubscriptionCallback } from "@pluv/types";
import type { Subject } from "wonka";
import { makeSubject, subscribe } from "wonka";

export class CrdtNotifier<TJson extends Record<string, any>> {
    public rootSubject = makeSubject<TJson>();

    public subjects = new Map<keyof TJson, Subject<TJson[keyof TJson]> | null>();

    public subject<TKey extends keyof TJson>(key: TKey): Subject<TJson[TKey]> {
        const subject = this.subjects.get(key);

        if (subject) {
            return subject as Subject<TJson[TKey]>;
        }

        const newSubject = makeSubject<TJson[TKey]>();

        this.subjects.set(key, newSubject);

        return newSubject as Subject<TJson[TKey]>;
    }

    public subcribeRoot(callback: (value: TJson) => void): () => void {
        return subscribe(callback)(this.rootSubject.source).unsubscribe;
    }

    public subscribe<TKey extends keyof TJson>(
        key: TKey,
        callback: StorageSubscriptionCallback<TJson, TKey>,
    ): () => void {
        const subject = this.subject(key);

        return subscribe(callback)(subject.source).unsubscribe;
    }
}
