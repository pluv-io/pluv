---
"@pluv/client": minor
"@pluv/react": minor
---

Stop handing out storage shared-types while storage is unavailable.

- `room.getStorage(...)` now returns `null` until storage is loaded. It previously returned a writable shared-type whose updates were discarded without an error, so consumers had to gate on the connection state themselves.
- `useStorage` now returns `[null, null] | [data, sharedType]` rather than two independently nullable values, so one null check narrows both. Exports the new `UseStorageResult` type.
- `useStorage` and `useDoc` now update when storage becomes unavailable, not only when it loads.
- `room.disconnect()` now reports storage as `unavailable` and stops observing the doc it destroyed.
- Storage updates that cannot be sent are now logged in debug mode instead of being dropped silently.
