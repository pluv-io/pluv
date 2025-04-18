---
"@pluv/io": patch
---

In certain edge-cases, WebSocket connections can silently die in all runtimes, causing connected clients to see the presence of other connections that aren't connected anymore.

The `IORoom` now automatically garbage collects dead websockets that haven't been pinged in a long time. Garbage collection happens on WebSocket ping/pong messages every 60 seconds.

However, garbage collection does not automatically happen for Cloudflare Worker Durable Objects using websocket hiberation because ping/pong messages happen outside of the Durable Object's compute. Therefore `IORoom` now provides a method `garbageCollect` that can be called manually to clear any dead websockets whenever the user chooses.

For example, within a Cloudflare Worker Durable Object, an [alarm](https://developers.cloudflare.com/durable-objects/api/alarms/) can be set to periodically run garbage collection for you:

```ts
import { InferIORoom } from "@pluv/io";

class RoomDurableObject extends DurableObject {
    private _room: InferIORoom<typeof ioServer>;

    constructor(state: DurableObjectState, env: Env) {
        super(state, env);

        this._room = io.createRoom(state.id.toString(), { env, state });
    }

    // ... WebSocket handlers here

    async fetch(request: Request): Promise<Response> {
        // ... WebSocket validation and pair creation here

        const alarm = await this.storage.getAlarm();

        // Start running the garbage collection interval
        if (alarm !== null) this.storage.setAlarm(Date.now() + 60_000);

        await this._room.register(server, { env: this.env, request });

        // ... Return response
    }

    async alarm(): Promise<void> {
        await this._room.garbageCollect();

        // Garbage collect every 1 minute
        await this.storage.setAlarm(Date.now() + 60_000);
    }
}
```
