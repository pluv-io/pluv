import type { InferYjsSharedTypeJson } from "@pluv/crdt-yjs";
import { makeSubject, Subject, subscribe } from "wonka";
import type { AbstractType } from "yjs";

export class CrdtNotifier<TStorage extends Record<string, AbstractType<any>>> {
    public subjects = new Map<
        keyof TStorage,
        Subject<InferYjsSharedTypeJson<TStorage[keyof TStorage]>> | null
    >();

    public subject<TKey extends keyof TStorage>(
        key: TKey
    ): Subject<InferYjsSharedTypeJson<TStorage[TKey]>> {
        const subject = this.subjects.get(key);

        if (subject) {
            return subject as Subject<InferYjsSharedTypeJson<TStorage[TKey]>>;
        }

        const newSubject =
            makeSubject<InferYjsSharedTypeJson<TStorage[TKey]>>();

        this.subjects.set(key, newSubject);

        return newSubject as Subject<InferYjsSharedTypeJson<TStorage[TKey]>>;
    }

    public subscribe<TKey extends keyof TStorage>(
        key: TKey,
        callback: (value: InferYjsSharedTypeJson<TStorage[TKey]>) => void
    ): () => void {
        const subject = this.subject(key);

        return subscribe(callback)(subject.source).unsubscribe;
    }
}
