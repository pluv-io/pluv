import type {
    Id,
    IOLike,
    JsonObject,
    OtherNotifierSubscriptionCallback,
    UserInfo,
} from "@pluv/types";
import type { Subject } from "wonka";
import { makeSubject, subscribe } from "wonka";

export class OtherNotifier<TIO extends IOLike, TPresence extends JsonObject = {}> {
    private _subjects = new Map<
        [clientId: string][0],
        Subject<Id<UserInfo<TIO, TPresence>> | null>
    >();

    public clear(): void {
        this._subjects.forEach((subject) => {
            subject.next(null);
        });

        this._subjects.clear();
    }

    public delete(clientId: string): void {
        this.subject(clientId).next(null);
        this._subjects.delete(clientId);
    }

    public subject(clientId: string): Subject<Id<UserInfo<TIO, TPresence>> | null> {
        const subject = this._subjects.get(clientId);

        if (subject) return subject;

        const newSubject = makeSubject<Id<UserInfo<TIO, TPresence>>>();

        this._subjects.set(clientId, newSubject);

        return newSubject;
    }

    public subscribe(
        clientId: string,
        callback: OtherNotifierSubscriptionCallback<TIO, TPresence>,
    ): () => void {
        const source = this.subject(clientId).source;

        return subscribe(callback)(source).unsubscribe;
    }
}
