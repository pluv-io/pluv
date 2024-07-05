import type { CrdtType, InferCrdtJson } from "@pluv/crdt";
import type { Subject } from "wonka";
import { makeSubject, subscribe } from "wonka";

export class CrdtNotifier<TStorage extends Record<string, CrdtType<any, any>>> {
    public rootSubject = makeSubject<{
        [P in keyof TStorage]: InferCrdtJson<TStorage[P]>;
    }>();

    public subjects = new Map<keyof TStorage, Subject<InferCrdtJson<TStorage[keyof TStorage]>> | null>();

    public subject<TKey extends keyof TStorage>(key: TKey): Subject<InferCrdtJson<TStorage[TKey]>> {
        const subject = this.subjects.get(key);

        if (subject) {
            return subject as Subject<InferCrdtJson<TStorage[TKey]>>;
        }

        const newSubject = makeSubject<InferCrdtJson<TStorage[TKey]>>();

        this.subjects.set(key, newSubject);

        return newSubject as Subject<InferCrdtJson<TStorage[TKey]>>;
    }

    public subcribeRoot(
        callback: (value: {
            [P in keyof TStorage]: InferCrdtJson<TStorage[P]>;
        }) => void,
    ): () => void {
        return subscribe(callback)(this.rootSubject.source).unsubscribe;
    }

    public subscribe<TKey extends keyof TStorage>(
        key: TKey,
        callback: (value: InferCrdtJson<TStorage[TKey]>) => void,
    ): () => void {
        const subject = this.subject(key);

        return subscribe(callback)(subject.source).unsubscribe;
    }
}
