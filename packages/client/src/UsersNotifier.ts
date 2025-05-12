import type {
    Id,
    IOLike,
    JsonObject,
    OtherNotifierSubscriptionCallback,
    OthersNotifierSubscriptionCallback,
    OthersNotifierSubscriptionEvent,
    UserInfo,
} from "@pluv/types";
import type { Subject } from "wonka";
import { makeSubject, subscribe, TypeOfSource } from "wonka";

export class UsersNotifier<TIO extends IOLike, TPresence extends JsonObject = {}> {
    public readonly others = makeSubject<{
        others: readonly Id<UserInfo<TIO, TPresence>>[];
        event: OthersNotifierSubscriptionEvent<TIO, TPresence>;
    }>();

    private _otherSubjects = new Map<
        [clientId: string][0],
        Subject<Id<UserInfo<TIO, TPresence>> | null>
    >();

    public clear(): void {
        this._otherSubjects.forEach((subject) => {
            subject.next(null);
        });

        this._otherSubjects.clear();
    }

    public delete(clientId: string): void {
        this.other(clientId).next(null);
        this._otherSubjects.delete(clientId);
    }

    public other(clientId: string): Subject<Id<UserInfo<TIO, TPresence>> | null> {
        const subject = this._otherSubjects.get(clientId);

        if (subject) return subject;

        const newSubject = makeSubject<Id<UserInfo<TIO, TPresence>>>();

        this._otherSubjects.set(clientId, newSubject);

        return newSubject;
    }

    public subscribeOther(
        clientId: string,
        callback: OtherNotifierSubscriptionCallback<TIO, TPresence>,
    ): () => void {
        const source = this.other(clientId).source;
        const subscription = subscribe(callback)(source);

        return subscription.unsubscribe;
    }

    public subscribeOthers(
        callback: OthersNotifierSubscriptionCallback<TIO, TPresence>,
    ): () => void {
        const subscription = subscribe<TypeOfSource<typeof this.others.source>>(
            ({ others, event }) => callback(others, event),
        )(this.others.source);

        return subscription.unsubscribe;
    }
}
