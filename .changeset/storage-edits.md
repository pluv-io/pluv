---
"@pluv/io": major
"@pluv/platform": major
---

`onStorageUpdated` is now `onStorageSnapshot`. It still receives `{ context, encodedState, room }` after the room writes the document into server storage.

`onStorageEdits` reports the edits from that document, about once a second. Each entry has the update bytes, the user, the operator, and the storage procedure name when the edit came from one.

```ts
onStorageSnapshot({ context, encodedState, room }) {}

onStorageEdits({ context, room, changes }) => {
    // changes: { update, user, operator, procedure }[]
}
```

The hosted webhook platform does not receive `onStorageEdits`. `flushCheckpoint` on a hosted room is now `flushSnapshot`.
