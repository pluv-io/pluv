---
"@pluv/treaty": minor
"@pluv/types": minor
"@pluv/io": minor
"@pluv/platform": minor
"pluv": minor
---

A treaty procedure can carry a description, and a host can read the room back after a call.

```ts
const select = t.procedure.presence
    .describe("Set the caller's selection")
    .input(z.object({ id: z.string().nullable() }))
    .resolve(({ id }) => ({ selectionId: id }));

const addMessage = t.procedure.storage
    .describe("Append a message to the room")
    .input(z.object({ text: z.string() }))
    .resolve(({ text }, { storage }) => {
        storage.messages.push([text]);
    });
```

`getTreatySchema()` returns that text as `description` beside `input`. A procedure without `.describe()` has `description: null`.

```ts
const sessions = manageSessions(io.server().createRoom(roomId));

const presence = await sessions
    .__experimental_presence({ senderId })
    .select({ id: "item-1" });
// { selectionId: "item-1" }

const document = await sessions.getStorageJson();
// { messages: ["hello"] }
```
