import type { IOPubSubEventMessage } from "./AbstractPubSub";
import { AbstractPubSub } from "./AbstractPubSub";

type PubSubHandler = (message: IOPubSubEventMessage<any>) => void | Promise<void>;

export class PubSub extends AbstractPubSub {
    private _nextId: number = 0;
    private _rooms = new Map<string, Map<number, PubSubHandler>>();

    public async publish(roomName: string, payload: IOPubSubEventMessage<any>): Promise<void> {
        const room = this._rooms.get(roomName);

        if (!room?.size) return;

        await Promise.all([...room.values()].map((handler) => Promise.resolve(handler(payload))));
    }

    public subscribe(roomName: string, onMessage: PubSubHandler): Promise<number> {
        const id = this._nextId++;
        const room = this._rooms.get(roomName) ?? new Map<number, PubSubHandler>();

        room.set(id, onMessage);
        this._rooms.set(roomName, room);

        return Promise.resolve(id);
    }

    public unsubscribe(subscriptionId: number): void {
        for (const [roomName, room] of this._rooms) {
            if (!room.delete(subscriptionId)) continue;

            if (room.size === 0) this._rooms.delete(roomName);

            return;
        }
    }
}
