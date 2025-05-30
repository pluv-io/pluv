---
"@pluv/crdt-loro": patch
"@pluv/crdt-yjs": patch
---

Fixed CRDT docs being considered as `empty` even when there are properties (i.e. yjs shared types and loro container types) on the document when they have not been modified.
