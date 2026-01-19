---
"@pluv/platform-cloudflare": minor
"@pluv/platform-node": minor
"@pluv/platform-pluv": minor
"@pluv/io": minor
---

### Deprecations

#### Deprecate `onDestroy` in favor of `onRoomDestroyed` and `onStorageDestroyed`

The `onDestroy` event handler has been **deprecated** in favor of two separate handlers that provide better control over when storage is saved. `onDestroy` still works for backward compatibility but will be removed in a future version.

**New Handlers:**

- **`onRoomDestroyed`**: Fires whenever a room is destroyed. This event does NOT include `encodedState` to prevent accidentally saving empty or uninitialized storage data.
- **`onStorageDestroyed`**: Only fires when the storage document is about to be destroyed after it has been initialized via `initializeSession`. This event includes `encodedState` and should be used for saving storage to your database.

**Deprecated Handler:**

- **`onDestroy`**: Still functional for backward compatibility. Fires whenever a room is destroyed (same timing as `onRoomDestroyed`) and includes `encodedState` in the event. A deprecation warning will be logged when used.

**Migration Guide:**

**Current (deprecated but still works):**
```typescript
io.server({
  onDestroy: async ({ encodedState, room }) => {
    // This could receive null/empty encodedState if storage wasn't initialized
    // Deprecation warning will be logged
    await saveToDatabase(room, encodedState);
  },
});
```

**Recommended (new approach):**
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

- `IORoomListenerEvent` includes `encodedState: string | null`
- `IORoomDestroyedEvent` is a new type that does NOT include `encodedState`
- `onRoomDeleted` now uses `IORoomDestroyedEvent` instead of `IORoomListenerEvent`
- `onDestroy` uses `IORoomListenerEvent` (includes `encodedState`) for backward compatibility