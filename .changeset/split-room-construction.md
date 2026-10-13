---
"@pluv/io": major
"@pluv/platform-pluv": major
---

`createRoom` returns the room. It no longer reads connected sockets. Call `manageSessions` to hydrate them and to register, broadcast, evict, and garbage-collect. `__experimental_presence` and `__experimental_storage` are on the session manager.

```ts
// Before
const room = ioServer.createRoom(roomId);

ws.on("message", async (data) => {
    await room.onMessage(ws)({ data });
});
ws.on("close", async (code, reason) => {
    await room.onClose(ws)({ code, reason: reason.toString() });
});
ws.on("error", async (error) => {
    await room.onError(ws)({ error, message: error.message });
});

await room.register(ws, { request, token });
await room.broadcast("sendMessage", { message: "hello" }, senderId);

// After
import { manageSessions } from "@pluv/io";

const room = ioServer.createRoom(roomId);
const sessions = manageSessions(room);

ws.on("message", async (data) => {
    await sessions.onMessage(ws)({ data });
});
ws.on("close", async (code, reason) => {
    await sessions.onClose(ws)({ code, reason: reason.toString() });
});
ws.on("error", async (error) => {
    await sessions.onError(ws)({ error, message: error.message });
});

await sessions.register(ws, { request, token });
await sessions.broadcast("sendMessage", { message: "hello" }, senderId);
await sessions.__experimental_storage.addMessage({ text: "hello" }, senderId);
```

Cloudflare still passes `{ env, state }` to `createRoom`. `manageSessions` takes only the room.

Listener events no longer include `platform` or `webSocket`. `onRoomMessage` no longer includes `encodedState`, and it no longer receives `$ping`, `$getOthers`, `$listUsers`, `$updatePresence`, or `$initializeSession`. Joins are `onUserConnected`. A client seed is `onStorageUpdated`. Read storage from `onStorageUpdated` and `onStorageDestroyed`. `onStorageUpdated` no longer includes `kind`, `operator`, or `user`. A promise it returns is kept alive until it settles. The checkpoint does not wait for that promise. A promise returned from `onRoomMessage` is kept alive the same way, and the message handler does not wait for it. A failed client seed does not call `onStorageUpdated` until a later copy lands.

A live storage edit is broadcast immediately and copied about a second later. A hard stop can drop that second. Shutdown still seals the latest copy on the way out.

`context()` no longer runs for `$ping`, `$getOthers`, `$listUsers`, or `$updatePresence`. A client seed still loads it for `onStorageUpdated`.

The room is destroyed only after `$exit` is sent, and only when no connection is registering. A register that ends without a socket still destroys the room when a disconnect left it empty.

```ts
// Before
onUserConnected({ context, encodedState, platform, room, user, webSocket }) {}
onRoomMessage({ context, encodedState, message, platform, room, user, webSocket }) {}

// After
onUserConnected({ context, encodedState, kind, operator, room, user }) {}
onRoomMessage({ context, kind, message, operator, room, user }) {}
onStorageUpdated({ context, encodedState, room }) {}
onStorageDestroyed({ context, encodedState, room }) {}
```

User procedure context no longer includes `platform`, `garbageCollect`, `storageSeeded`, the raw socket, or the connection list. The caller's identity is `user`, `kind`, and `operator`.

```ts
// Before
.broadcast(({ message }, { doc, garbageCollect, platform, presence, session, sessions }) => {
    session.user;
    session.webSocket;
})

// After
.broadcast(({ message }, { connectionId, context, doc, kind, operator, presence, room, time, user }) => {
    user;
    presence;
})
```
