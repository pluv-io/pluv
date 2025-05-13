import type {
    Id,
    IOLike,
    JsonObject,
    StateNotifierSubjects,
    SubscriptionCallback,
    UserInfo,
    WebSocketState,
} from "@pluv/types";
import type { Subject } from "wonka";
import { makeSubject, subscribe } from "wonka";

type InferSubjectValue<
    TIO extends IOLike,
    TPresence extends JsonObject,
    TSubject extends keyof StateNotifierSubjects<TIO, TPresence>,
> =
    StateNotifierSubjects<TIO, TPresence>[TSubject] extends Subject<infer IValue>
        ? Id<IValue>
        : never;

export class StateNotifier<TIO extends IOLike, TPresence extends JsonObject = {}> {
    public subjects: StateNotifierSubjects<TIO, TPresence> = {
        connection: makeSubject<Id<WebSocketState<TIO>>>(),
        "my-presence": makeSubject<TPresence>(),
        myself: makeSubject<Readonly<Id<UserInfo<TIO, TPresence>>> | null>(),
        others: makeSubject<readonly Id<UserInfo<TIO, TPresence>>[]>(),
        "storage-loaded": makeSubject<true>(),
    };

    public subscribe<TSubject extends keyof StateNotifierSubjects<TIO, TPresence>>(
        name: TSubject,
        callback: SubscriptionCallback<TIO, TPresence, TSubject>,
    ): () => void {
        const source = this.subjects[name]?.source as any;

        if (!source) throw new Error(`Could not subscribe to source: ${name}`);

        return subscribe(callback)(source).unsubscribe;
    }
}
