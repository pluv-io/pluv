---
"@pluv/client": patch
---

Updated PluvRoom.updateMyPresence to allow passing in a callback function that exposes the previous presence value and returns a presence update.

```ts
type Presence = {
    selectionId: string | null;
};

const room: PluvRoom = /* ... */;
const newSelectionId: string | null = /* ... */;

room.updateMyPresence({ selectionId: newSelection });

// You can reference the previous presence and return a new presence based on it
room.updateMyPresence((previousPresence) => ({ selectionId: newSelection ?? previousPresence.selectionId }));
```
