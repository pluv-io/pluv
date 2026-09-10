---
"@pluv/crdt-loro": minor
"@pluv/crdt-yjs": minor
"@pluv/crdt": minor
"@pluv/types": minor
"@pluv/io": patch
---

Prevent room teardown from persisting an empty document over saved storage.

- `IORoom` teardown is now atomic. A second teardown joins the one already in flight instead of re-running it and emitting `onStorageDestroyed` with a document that was already cleared.
- `IORoom.register` now waits for an in-flight teardown, so a connection arriving mid-teardown re-initializes from storage instead of binding to the cleared document.
- Added `isDirty()` to `CrdtDocLike`, implemented for the yjs, loro and noop documents. It reports whether a document has ever been written to, and teardown uses it to skip `onStorageDestroyed` for a document that never was. It is not the inverse of `isEmpty()`: deleting all content leaves a document dirty, so emptied storage still persists.
- Breaking for external `CrdtDocLike` implementations: `isDirty()` is a new required member.
