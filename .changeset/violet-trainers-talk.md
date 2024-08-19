---
"@pluv/io": minor
---

Fixed websocket messages getting lost after the Cloudflare Worker Durable Object wakes up from hibernation.

**BREAKING**

Updated `onMessage`, `onClose` and `onError` to all return `Promise.void` instead of `void`.

```ts
// Before

const io = createIO(/* ... */);
const ioServer = io.server(/* ... */);

class RoomDurableObject implements DurableObject {
    public  webSocketClose(ws: WebSocket, code: number, reason: string): void {
        const handler = this._room.onClose(ws);

        // Previously returned `void`
        handler({ code, reason });
    }

    public  webSocketError(ws: WebSocket, error: unknown): void {
        const handler = this._room.onError(ws);
        const eventError = error instanceof Error ? error : new Error("Internal Error");

        // Previously returned `void`
        handler({ error: eventError, message: eventError.message });
    }

    public  webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): void {
        const handler = this._room.onMessage(ws);

        // Previously returned `void`
        handler({ data: message });
    }
}

// After

const io = createIO(/* ... */);
const ioServer = io.server(/* ... */);

class RoomDurableObject implements DurableObject {
    public async webSocketClose(ws: WebSocket, code: number, reason: string): Promise<void> {
        const handler = this._room.onClose(ws);

        // Handler must now be awaited
        await handler({ code, reason });
    }

    public async webSocketError(ws: WebSocket, error: unknown): Promise<void> {
        const handler = this._room.onError(ws);
        const eventError = error instanceof Error ? error : new Error("Internal Error");

        // Handler must now be awaited
        await handler({ error: eventError, message: eventError.message });
    }

    public async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
        const handler = this._room.onMessage(ws);

        // Handler must now be awaited
        await handler({ data: message });
    }
}
```

