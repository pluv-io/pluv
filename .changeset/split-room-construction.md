---
"@pluv/io": major
"@pluv/platform-pluv": major
---

`createRoom` returns the room. Register, broadcast, and socket events go through `manageSessions`.

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
await sessions.__experimental_storage({ senderId }).addMessage({ text: "hello" });
```

Cloudflare still passes `{ env, state }` to `createRoom`. Pass only the room to `manageSessions`.

Room listeners no longer receive `platform` or `webSocket`. `onRoomMessage` no longer receives `encodedState`, and it does not run for `$ping`, `$getOthers`, `$listUsers`, `$updatePresence`, or `$initializeSession`. A join is `onUserConnected`. A client loading storage is `onStorageUpdated`. Read the document from `onStorageUpdated` and `onStorageDestroyed`. `onStorageUpdated` no longer receives `kind`, `operator`, or `user`.

```ts
// Before
onUserConnected({ context, encodedState, platform, room, user, webSocket }) {}
onRoomMessage({ context, encodedState, message, platform, room, user, webSocket }) {}
onStorageUpdated({ context, encodedState, kind, operator, platform, room, user, webSocket }) {}
onStorageDestroyed({ context, encodedState, platform, room }) {}

// After
onUserConnected({ context, encodedState, kind, operator, room, user }) {}
onRoomMessage({ context, kind, message, operator, room, user }) {}
onStorageUpdated({ context, encodedState, room }) {}
onStorageDestroyed({ context, encodedState, room }) {}
```

Procedures defined via `io.procedure` no longer receive `platform`, `garbageCollect`, `storageSeeded`, the socket, or the connection list. The caller is `user`, `kind`, and `operator`.

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
