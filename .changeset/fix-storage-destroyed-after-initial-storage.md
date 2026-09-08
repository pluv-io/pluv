---
"@pluv/io": patch
---

Fix `onStorageDestroyed` never firing for rooms hydrated from `getInitialStorage`.

Storage loaded from `getInitialStorage` was not marked as initialized, and the loaded content made `_wasDocEmptyOnInit` false, which permanently prevented the room from marking storage as initialized later. `onStorageDestroyed` was gated on that flag, so rooms that cold-started with content from an external store could never persist again and the external store kept its original snapshot.
