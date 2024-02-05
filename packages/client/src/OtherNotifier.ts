import type { Id, IOLike } from "@pluv/types";
import type { Subject } from "wonka";
import { makeSubject, subscribe } from "wonka";
import type { UserInfo } from "./types";

export type OtherNotifierSubscriptionCallback<TIO extends IOLike> = (
    value: Id<UserInfo<TIO>> | null,
) => void;

export class OtherNotifier<TIO extends IOLike> {
    public subjects = new Map<string, Subject<Id<UserInfo<TIO>> | null>>();

    public subject<TEvent extends string>(
        name: TEvent,
    ): Subject<Id<UserInfo<TIO>> | null> {
        const subject = this.subjects.get(name);

        if (subject) return subject;

        const newSubject = makeSubject<Id<UserInfo<TIO>>>();

        this.subjects.set(name, newSubject);

        return newSubject;
    }

    public subscribe<TEvent extends string>(
        name: TEvent,
        callback: OtherNotifierSubscriptionCallback<TIO>,
    ): () => void {
        const source = this.subject(name).source;

        return subscribe(callback)(source).unsubscribe;
    }
}
