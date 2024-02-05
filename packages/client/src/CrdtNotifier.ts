import type { AbstractCrdtType, InferCrdtStorageJson } from "@pluv/crdt";
import { makeSubject, Subject, subscribe } from "wonka";

export class CrdtNotifier<
    TStorage extends Record<string, AbstractCrdtType<any>>,
> {
    public rootSubject = makeSubject<{
        [P in keyof TStorage]: InferCrdtStorageJson<TStorage[P]>;
    }>();

    public subjects = new Map<
        keyof TStorage,
        Subject<InferCrdtStorageJson<TStorage[keyof TStorage]>> | null
    >();

    public subject<TKey extends keyof TStorage>(
        key: TKey,
    ): Subject<InferCrdtStorageJson<TStorage[TKey]>> {
        const subject = this.subjects.get(key);

        if (subject) {
            return subject as Subject<InferCrdtStorageJson<TStorage[TKey]>>;
        }

        const newSubject = makeSubject<InferCrdtStorageJson<TStorage[TKey]>>();

        this.subjects.set(key, newSubject);

        return newSubject as Subject<InferCrdtStorageJson<TStorage[TKey]>>;
    }

    public subcribeRoot(
        callback: (value: {
            [P in keyof TStorage]: InferCrdtStorageJson<TStorage[P]>;
        }) => void,
    ): () => void {
        return subscribe(callback)(this.rootSubject.source).unsubscribe;
    }

    public subscribe<TKey extends keyof TStorage>(
        key: TKey,
        callback: (value: InferCrdtStorageJson<TStorage[TKey]>) => void,
    ): () => void {
        const subject = this.subject(key);

        return subscribe(callback)(subject.source).unsubscribe;
    }
}
