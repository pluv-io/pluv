---
"@pluv/platform-cloudflare": minor
"@pluv/platform-node": minor
"@pluv/platform-pluv": minor
"@pluv/io": minor
---

### Deprecations

#### Deprecate `onDestroy` and `onRoomDeleted` in favor of `onRoomDestroyed` and `onStorageDestroyed`

Two event handlers have been **deprecated** in favor of two separate handlers that provide better control over when storage is saved. Both deprecated handlers still work for backward compatibility but will be removed in a future version.

**New Handlers:**

- **`onRoomDestroyed`**: Fires whenever a room is destroyed. This event does NOT include `encodedState` to prevent accidentally saving empty or uninitialized storage data.
- **`onStorageDestroyed`**: Only fires when the storage document is about to be destroyed after it has been initialized via `initializeSession`. This event includes `encodedState` and should be used for saving storage to your database.

**Deprecated Handlers:**

- **`onDestroy`** (room-level only, via `createRoom`): Still functional for backward compatibility. Fires whenever a room is destroyed (same timing as `onRoomDestroyed`) and includes `encodedState` in the event. A deprecation warning will be logged when used. Note: This is only available at the room level via `createRoom`, not at the server level.
- **`onRoomDeleted`** (server-level): Still functional for backward compatibility. Fires whenever a room is destroyed and includes `encodedState` in the event (restored for backward compatibility). A deprecation warning will be logged when used. Use `onRoomDestroyed` (no `encodedState`) and `onStorageDestroyed` (with `encodedState`) instead.

**Migration Guide:**

**Current (deprecated but still works):**
```typescript
// Room-level onDestroy (deprecated)
const room = io.createRoom("room-id", {
  onDestroy: async ({ encodedState, room }) => {
    // This could receive null/empty encodedState if storage wasn't initialized
    // Deprecation warning will be logged
    await saveToDatabase(room, encodedState);
  },
});

// Server-level onRoomDeleted (deprecated)
io.server({
  onRoomDeleted: async ({ encodedState, room }) => {
    // Deprecation warning will be logged
    await saveToDatabase(room, encodedState);
  },
});
```

**Recommended (new approach):**
```typescript
// Room-level handlers
const room = io.createRoom("room-id", {
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

// Server-level handlers
// Note: There is no server-level onRoomDestroyed (without encodedState)
// Use onStorageDestroyed for storage cleanup
io.server({
  onStorageDestroyed: async ({ encodedState, room }) => {
    // Only fires when storage was initialized via initializeSession
    // Safe to save to database
    await saveToDatabase(room, encodedState);
  },
});
```

**Type Changes:**

- `IORoomListenerEvent` includes `encodedState: string | null`
- `IORoomDestroyedEvent` is a new type that does NOT include `encodedState`
- `onRoomDeleted` uses `IORoomListenerEvent` (includes `encodedState`) but is deprecated
- `onDestroy` uses `IORoomListenerEvent` (includes `encodedState`) for backward compatibility and is room-level only