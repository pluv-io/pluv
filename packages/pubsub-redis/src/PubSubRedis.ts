import type { IOPubSubEventMessage } from "@pluv/io";
import { AbstractPubSub } from "@pluv/io";
import type { Cluster, Redis } from "ioredis";

export type RedisClient = Cluster | Redis;

export interface PubSubRedisOptions {
    publisher: RedisClient;
    subscriber: RedisClient;
}

export class PubSubRedis extends AbstractPubSub {
    private _currentSubscriptionId: number = 0;
    private _publisher: RedisClient;
    private _subscriber: RedisClient;
    private _subscriptionsRefs = new Map<string, readonly number[]>();
    private _subscriptions = new Map<
        number,
        [roomName: string, onMessage: (message: IOPubSubEventMessage<any>) => void]
    >();

    constructor(options: PubSubRedisOptions) {
        super();

        const { publisher, subscriber } = options;

        this._publisher = publisher;
        this._subscriber = subscriber;

        (this._subscriber as Redis).on("message", this._onMessage.bind(this));
    }

    public async close(): Promise<"OK"[]> {
        return Promise.all([this._publisher.quit(), this._subscriber.quit()]);
    }

    public getPublisher(): RedisClient {
        return this._publisher;
    }

    public getSubscriber(): RedisClient {
        return this._subscriber;
    }

    public async publish(roomName: string, payload: IOPubSubEventMessage<any>): Promise<void> {
        await this._publisher.publish(roomName, JSON.stringify(payload));
    }

    public async subscribe(
        roomName: string,
        onMessage: (message: IOPubSubEventMessage<any>) => void,
    ): Promise<number> {
        const id = this._currentSubscriptionId++;
        const refs = this._subscriptionsRefs.get(roomName) ?? [];

        this._subscriptions.set(id, [roomName, onMessage]);
        this._subscriptionsRefs.set(roomName, [...refs, id]);
        await this._subscriber.subscribe(roomName);

        return id;
    }

    public unsubscribe(subscriptionId: number): void {
        const [roomName] = this._subscriptions.get(subscriptionId) ?? [];

        if (!roomName) return;

        const refs = this._subscriptionsRefs.get(roomName);

        if (!refs) return;

        if (refs.length === 1) {
            this._subscriber.unsubscribe(roomName);
            this._subscriptionsRefs.delete(roomName);
            this._subscriptions.delete(subscriptionId);

            return;
        }

        const index = refs.indexOf(subscriptionId);

        this._subscriptionsRefs.set(
            roomName,
            index === -1 ? refs : [...refs.slice(0, index), ...refs.slice(index + 1)],
        );

        this._subscriptions.delete(subscriptionId);
    }

    private _onMessage(roomName: string, message: string) {
        const subscribers = this._subscriptionsRefs.get(roomName);

        if (!subscribers?.length) return;

        const parsed: IOPubSubEventMessage<any> =
            typeof message === "string" ? JSON.parse(message) : message;

        subscribers.forEach((id) => {
            const subscription = this._subscriptions.get(id);

            if (!subscription) return;

            const [, listener] = subscription;

            listener(parsed);
        });
    }
}
