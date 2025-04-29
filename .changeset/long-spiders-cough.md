---
"@pluv/crdt-yjs": patch
---

Updated `batchApplyEncodedState` to use `Yjs.mergeUpdates` to more efficiently update the document under-the-hood, while also producing a smaller document.
