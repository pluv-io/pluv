---
"@pluv/platform-cloudflare": major
"@pluv/platform-node": major
"@pluv/platform-pluv": major
"@pluv/io": major
---

### Breaking Changes

This release includes the following breaking changes:

1. **Removed `onDestroy` handler** (room-level only) - replaced with `onRoomDestroyed` and `onStorageDestroyed`
2. **Removed `onRoomDeleted` handler** (server-level) - replaced with `onRoomDestroyed` and `onStorageDestroyed`
3. **Listeners can no longer be configured at room-level** - all listeners must be configured at server-level via `io.server()`
4. **Event type changes** - `IORoomDestroyedEvent` no longer includes `encodedState`

#### Remove `onDestroy` and `onRoomDeleted` in favor of `onRoomDestroyed` and `onStorageDestroyed`

**BREAKING**: Two event handlers have been **removed** in favor of two separate handlers that provide better control over when storage is saved. This is a breaking change that requires code updates.

**New Handlers:**

- **`onRoomDestroyed`**: Fires whenever a room is destroyed. This event does NOT include `encodedState` to prevent accidentally saving empty or uninitialized storage data. **Available only at server-level** via `io.server()`.
- **`onStorageDestroyed`**: Only fires when the storage document is about to be destroyed after it has been initialized via `initializeSession`. This event includes `encodedState` and should be used for saving storage to your database. **Available only at server-level** via `io.server()`.

**Removed Handlers:**

- **`onDestroy`** (room-level only, via `createRoom`): **REMOVED**. Use `onRoomDestroyed` and `onStorageDestroyed` instead.
- **`onRoomDeleted`** (server-level): **REMOVED**. Use `onRoomDestroyed` and `onStorageDestroyed` instead.

**Migration Guide:**

**Old (no longer works):**
```typescript
// Room-level onDestroy (removed)
const room = io.createRoom("room-id", {
  onDestroy: async ({ encodedState, room }) => {
    // This no longer works
    await saveToDatabase(room, encodedState);
  },
});

// Server-level onRoomDeleted (removed)
io.server({
  onRoomDeleted: async ({ encodedState, room }) => {
    // This no longer works
    await saveToDatabase(room, encodedState);
  },
});
```

**New (recommended approach):**
```typescript
// Server-level handlers (recommended - all listeners are now server-level)
io.server({
  onRoomDestroyed: async ({ room }) => {
    // Room destroyed - use for cleanup if needed
    await cleanupRoom(room);
  },
  onStorageDestroyed: async ({ encodedState, room }) => {
    // Only fires when storage was initialized via initializeSession
    // Safe to save to database
    await saveToDatabase(room, encodedState);
  },
});

// Rooms are created without listener options
const room = io.createRoom("room-id");
```

#### Type Changes

**BREAKING**: The following type changes may require TypeScript code updates:

- **`IORoomDestroyedEvent`** no longer includes `encodedState` (breaking change if you were accessing `encodedState` from this event)
- **`IORoomListenerEvent`** includes `encodedState: string | null` (used by `onStorageDestroyed`)
- **All listeners must be configured at the server level** via `io.server()`, not at the room level via `createRoom()` (breaking change - room-level listener configuration is no longer supported)
- **`CreateRoomOptions`** now correctly requires platform-specific room context properties (e.g., `env` and `state` for Cloudflare) when they are required by the platform, while properly handling optional properties like `meta` (breaking change - TypeScript will now correctly enforce required properties)
