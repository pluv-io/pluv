---
"@pluv/crdt-yjs": minor
"@pluv/client": minor
"@pluv/react": minor
---

Added ability to undo and redo changes to storage.

## @pluv/crdt-yjs

`@pluv/crdt-yjs` now exposes 5 new methods: `canRedo`, `canUndo`, `redo`, `undo` and `trackOrigins`.

Refer to the code-example below to better understand how to undo and redo with your doc.

```ts
// Example
import { array, doc } from "@pluv/crdt-yjs";

// Create your doc with your shared-types
const myDoc = doc({
    messages: array<string>([]),
});

/**
 * @description Track origins to enable undos and redos for your document.
 * trackOrigins must be called before any storage mutations, to enable those
 * mutations to be undone/redone.
 */
myDoc.trackOrigins({
    /**
     * @description This is the same `captureTimeout` option from yjs's UndoManager.
     * This specifies a number in ms, during which edits are merged together to be
     * undone together. Set this to 0, to track each transacted change individually.
     * @see (@link https://docs.yjs.dev/api/undo-manager)
     * @default 500
     */
    captureTimeout: 500,
    /**
     * @desription This is the same `trackedOrigins` option from yjs's UndoManager.
     * This specifies transaction origins (strings only) to filter which transactions
     * can be undone.
     * @see (@link https://docs.yjs.dev/api/undo-manager)
     * @default undefined
     */
    trackedOrigins: ["user-123"],
});

/**
 * @description Check whether calling undo will mutate storage
 * @returns boolean
 */
myDoc.canUndo();
/**
 * @description Check whether calling redo will mutate storage
 * @returns boolean
 */
myDoc.canRedo();

// Perform a storage mutation within a transaction so that it can be affected
// by undo/redo operations.
myDoc.transact(() => {
    myDoc.get("messages").push(["hello world!"]);
}, "user-123");

/**
 * @description Undoes the last valid mutation to storage
 */
myDoc.undo();

/**
 * @description Re-applies the last undone mutation to storage
 */
myDoc.redo();
```

## @pluv/client

`@pluv/client`'s `PluvRoom` and `MockedRoom` now exposes 5 new methods: `canRedo`, `canUndo`, `redo`, `undo` and `transact`.

Refer to the code-example below to better understand how to undo and redo with your `PluvRoom`.

```ts
import { createClient, y } from "@pluv/client";

const client = createClient({});

/**
 * @description When a room is created, undo/redo will automatically
 * be configured to filter for changes made by the connected user
 * (so that users only undo/redo their changes).
 */
const room = client.createRoom("my-room", {
    initialStorage: () => ({
        messages: y.array<string>([]),
    }),
    /**
     * @description This is the same `captureTimeout` option from yjs's UndoManager.
     * This specifies a number in ms, during which edits are merged together to be
     * undone together. Set this to 0, to track each transacted change individually.
     * @see (@link https://docs.yjs.dev/api/undo-manager)
     * @default 500
     */
    captureTimeout: 500,
    /**
     * @desription This is the same `trackedOrigins` option from yjs's UndoManager.
     * This specifies transaction origins (strings only) to filter which transactions
     * can be undone.
     * When omitted, the user's connection id will be tracked. When provided,
     * specifies additional tracked origins besides the user's connection id.
     * @see (@link https://docs.yjs.dev/api/undo-manager)
     * @default undefined
     */
    trackedOrigins: ["user-123"],
});

/**
 * @description Check whether calling undo will mutate storage
 * @returns boolean
 */
room.canUndo();
/**
 * @description Check whether calling redo will mutate storage
 * @returns boolean
 */
room.canRedo();

/**
 * @description Calling transact will enable a storage mutation to be undone/redone.
 * When called without an origin, the origin will default to the user's connection
 * id.
 * 
 * You can specify a 2nd parameter to transact with a different transaction origin.
 */
room.transact(() => {
    room.get("messages").push(["hello world!"]);
});

// This will also be undoable because `"user-123"` is a tracked origin.
room.transact(() => {
    room.get("messages").push(["hello world!"]);
}, "user-123");

/**
 * @description Undoes the last valid mutation to storage
 */
room.undo();

/**
 * @description Re-applies the last undone mutation to storage
 */
room.redo();
```

## @pluv/react

`@pluv/react`'s `createRoomBundle` now exposes 5 new react hooks: `usePluvCanRedo`, `usePluvCanUndo`, `usePluvRedo`, `usePluvUndo` and `usePluvTransact`.

Refer to the code-example below to better understand how to undo and redo with your `createRoomBundle`.

```tsx
import { createBundle, createClient, y } from "@pluv/react";
import { type io } from "./io";

const client = createClient<typeof io>();

const { createRoomBundle } = createBundle(client);

const {
    usePluvCanRedo,
    usePluvCanUndo,
    usePluvRedo,
    usePluvStorage,
    usePluvTransact,
    usePluvUndo,
} = createRoomBundle({
    initialStorage: () => ({
        messages: y.array<string>([]),
    }),
    /**
     * @description This is the same `captureTimeout` option from yjs's UndoManager.
     * This specifies a number in ms, during which edits are merged together to be
     * undone together. Set this to 0, to track each transacted change individually.
     * @see (@link https://docs.yjs.dev/api/undo-manager)
     * @default 500
     */
    captureTimeout: 500,
    /**
     * @desription This is the same `trackedOrigins` option from yjs's UndoManager.
     * This specifies transaction origins (strings only) to filter which transactions
     * can be undone.
     * When omitted, the user's connection id will be tracked. When provided,
     * specifies additional tracked origins besides the user's connection id.
     * @see (@link https://docs.yjs.dev/api/undo-manager)
     * @default undefined
     */
    trackedOrigins: ["user-123"],
});

/**
 * @description Check whether calling undo will mutate storage
 */
const canUndo: boolean = usePluvCanUndo();
/**
 * @description Check whether calling redo will mutate storage
 */
const canRedo: boolean = usePluvCanRedo();

const [messages, sharedType] = usePluvStorage("messages");

/**
 * @description Calling transact will enable a storage mutation to be undone/redone.
 * When called without an origin, the origin will default to the user's connection
 * id.
 * 
 * You can specify a 2nd parameter to transact with a different transaction origin.
 */
const transact = usePluvTransact();

transact(() => {
    sharedType?.push(["hello world!"]);
});

// This will also be undoable because `"user-123"` is a tracked origin.
transact(() => {
    sharedType?.push(["hello world!"]);
}, "user-123");

/**
 * @description Undoes the last valid mutation to storage
 */
const undo = usePluvUndo();

undo();

/**
 * @description Re-applies the last undone mutation to storage
 */
const redo = usePluvRedo();

redo();
```
