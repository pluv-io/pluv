---
"@pluv/platform-cloudflare": major
"@pluv/platform-node": major
"@pluv/platform-pluv": major
"@pluv/io": major
---

### Breaking Changes

#### Split `onDestroy` into `onRoomDestroyed` and `onStorageDestroyed`

The `onDestroy` event handler has been split into two separate handlers to provide better control over when storage is saved:

- **`onRoomDestroyed`**: Fires whenever a room is destroyed. This event no longer includes `encodedState` to prevent accidentally saving empty or uninitialized storage data.
- **`onStorageDestroyed`**: Only fires when the storage document is about to be destroyed after it has been initialized via `initializeSession`. This event includes `encodedState` and should be used for saving storage to your database.

**Migration Guide:**

**Before:**
```typescript
io.server({
  onDestroy: async ({ encodedState, room }) => {
    // This could receive null/empty encodedState if storage wasn't initialized
    await saveToDatabase(room, encodedState);
  },
});
```

**After:**
```typescript
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
```

**Type Changes:**

- `IORoomListenerEvent` now includes `encodedState: string | null`
- `IORoomDestroyedEvent` is a new type that does NOT include `encodedState`
- `onRoomDeleted` now uses `IORoomDestroyedEvent` instead of `IORoomListenerEvent`
