import type { IOEventMessage, IOLike, InferIOOutput } from "@pluv/types";
import type { SendMessageOptions } from "./types";

export type IOPubSubEventMessage<
    TIO extends IOLike,
    TEvent extends keyof InferIOOutput<TIO> = keyof InferIOOutput<TIO>
> = IOEventMessage<TIO, TEvent> & {
    options?: SendMessageOptions;
};

export abstract class AbstractPubSub {
    public abstract publish(
        roomName: string,
        payload: IOPubSubEventMessage<any>
    ): Promise<void>;

    public abstract subscribe(
        roomName: string,
        onMessage: (message: IOPubSubEventMessage<any>) => void
    ): Promise<number>;

    public abstract unsubscribe(subscriptionId: number): void;
}
