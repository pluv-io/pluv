import type { Subject } from "wonka";
import { makeSubject, subscribe } from "wonka";
import type { IOPubSubEventMessage } from "./AbstractPubSub";
import { AbstractPubSub } from "./AbstractPubSub";

export class PubSub extends AbstractPubSub {
    private _currentSubscriptionId: number = 0;
    // Map of roomName to subjects
    private _subjects = new Map<string, Subject<IOPubSubEventMessage<any>>>();
    // Map of roomName to subscription ids
    private _subscriptionsRefs = new Map<string, readonly number[]>();
    // Map of
    private _unsubscriptions = new Map<number, [roomName: string, unsubscribe: () => void]>();

    public async publish(roomName: string, payload: IOPubSubEventMessage<any>): Promise<void> {
        const subject = this._subjects.get(roomName);

        if (!subject) return;

        Promise.resolve(subject.next(payload));
    }

    public subscribe(roomName: string, onMessage: (message: IOPubSubEventMessage<any>) => void): Promise<number> {
        const id = this._currentSubscriptionId++;
        const refs = this._subscriptionsRefs.get(roomName) ?? [];

        const subject = makeSubject<IOPubSubEventMessage<any>>();

        this._subjects.set(roomName, subject);
        this._subscriptionsRefs.set(roomName, [...refs, id]);

        const unsubscribe = subscribe(onMessage)(subject.source).unsubscribe;

        this._unsubscriptions.set(id, [roomName, unsubscribe]);

        return Promise.resolve(id);
    }

    public unsubscribe(subscriptionId: number): void {
        const [roomName, unsubscribe] = this._unsubscriptions.get(subscriptionId) ?? [];

        if (!roomName || !unsubscribe) return;

        const refs = this._subscriptionsRefs.get(roomName);

        if (!refs) return;

        if (refs.length === 1) {
            this._subjects.delete(roomName);
            this._subscriptionsRefs.delete(roomName);
            this._unsubscriptions.delete(subscriptionId);

            return;
        }

        const index = refs.indexOf(subscriptionId);

        this._subscriptionsRefs.set(
            roomName,
            index === -1 ? refs : [...refs.slice(0, index), ...refs.slice(index + 1)],
        );

        unsubscribe();

        this._unsubscriptions.delete(subscriptionId);
    }
}
