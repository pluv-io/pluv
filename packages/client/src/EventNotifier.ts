import type { Id, InferIOOutput, IOEventMessage, IOLike } from "@pluv/types";
import type { Subject } from "wonka";
import { makeSubject, subscribe } from "wonka";

export type EventNotifierSubscriptionCallback<
    TIO extends IOLike,
    TEvent extends keyof InferIOOutput<TIO>,
> = (value: Id<IOEventMessage<TIO, TEvent>>) => void;

export class EventNotifier<TIO extends IOLike> {
    public subjects = new Map<
        keyof InferIOOutput<TIO>,
        Subject<Id<IOEventMessage<TIO, keyof InferIOOutput<TIO>>>>
    >();

    public subject<TEvent extends keyof InferIOOutput<TIO>>(
        name: TEvent,
    ): Subject<Id<IOEventMessage<TIO, TEvent>>> {
        const subject = this.subjects.get(name);

        if (subject) return subject;

        const newSubject = makeSubject<Id<IOEventMessage<TIO, TEvent>>>();

        this.subjects.set(name, newSubject);

        return newSubject;
    }

    public subscribe<TEvent extends keyof InferIOOutput<TIO>>(
        name: TEvent,
        callback: EventNotifierSubscriptionCallback<TIO, TEvent>,
    ): () => void {
        const subject = this.subject(name);

        return subscribe(callback)(subject.source).unsubscribe;
    }
}
