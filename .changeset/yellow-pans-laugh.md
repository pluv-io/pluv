---
"@pluv/crdt-loro": major
"@pluv/crdt-yjs": major
---

**BREAKING** Removed deprecated ability to set top-level document types via the yjs shared-type and loro container type utilities (e.g. `yjs.array`, `loro.list`). These must now use the builder type provided in the 1st positional parameter of `yjs.doc` and `loro.doc`.
