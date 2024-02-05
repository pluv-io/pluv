import type { Id, IOLike, JsonObject } from "@pluv/types";
import type { Subject } from "wonka";
import { makeSubject, subscribe } from "wonka";
import type { UserInfo, WebSocketState } from "./types";

export interface StateNotifierSubjects<
    TIO extends IOLike,
    TPresence extends JsonObject,
> {
    connection: Subject<Id<WebSocketState<TIO>>>;
    "my-presence": Subject<TPresence | null>;
    myself: Subject<Readonly<Id<UserInfo<TIO>>> | null>;
    others: Subject<readonly Id<UserInfo<TIO>>[]>;
}

type InferSubjectValue<
    TIO extends IOLike,
    TPresence extends JsonObject,
    TSubject extends keyof StateNotifierSubjects<TIO, TPresence>,
> =
    StateNotifierSubjects<TIO, TPresence>[TSubject] extends Subject<
        infer IValue
    >
        ? Id<IValue>
        : never;

export type SubscriptionCallback<
    TIO extends IOLike,
    TPresence extends JsonObject,
    TSubject extends keyof StateNotifierSubjects<TIO, TPresence>,
> = (value: InferSubjectValue<TIO, TPresence, TSubject>) => void;

export class StateNotifier<
    TIO extends IOLike,
    TPresence extends JsonObject = {},
> {
    public subjects: StateNotifierSubjects<TIO, TPresence> = {
        connection: makeSubject<Id<WebSocketState<TIO>>>(),
        "my-presence": makeSubject<TPresence>(),
        myself: makeSubject<Readonly<Id<UserInfo<TIO>>> | null>(),
        others: makeSubject<readonly Id<UserInfo<TIO>>[]>(),
    };

    public subscribe<
        TSubject extends keyof StateNotifierSubjects<TIO, TPresence>,
    >(
        name: TSubject,
        callback: SubscriptionCallback<TIO, TPresence, TSubject>,
    ): () => void {
        const source = this.subjects[name]?.source as any;

        if (!source) throw new Error(`Could not subscribe to source: ${name}`);

        return subscribe(callback)(source).unsubscribe;
    }
}
