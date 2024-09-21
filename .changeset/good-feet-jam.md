---
"@pluv/react": minor
---

**BREAKING**

Merge `createBundle` with `createRoomBundle`.

```ts
// Before
const {
    createRoomBundle,

    // components
    PluvProvider,

    // hooks
    useClient,
} = createBundle(client);

export const {
    // components
    MockedRoomProvider,
    PluvRoomProvider,

    // utils
    event,

    // hooks
    useBroadcast,
    useCanRedo,
    useCanUndo,
    useConnection,
    useDoc,
    useEvent,
    useMyPresence,
    useMyself,
    useOther,
    useOthers,
    useRedo,
    useRoom,
    useStorage,
    useTransact,
    useUndo,
} = createRoomBundle({});

// After
const {
    // components
    MockedRoomProvider,
    PluvProvider,
    PluvRoomProvider,

    // utils
    event,

    // hooks
    useBroadcast,
    useCanRedo,
    useCanUndo,
    useClient,
    useConnection,
    useDoc,
    useEvent,
    useMyPresence,
    useMyself,
    useOther,
    useOthers,
    useRedo,
    useRoom,
    useStorage,
    useTransact,
    useUndo,
} = createBundle(client);
```
