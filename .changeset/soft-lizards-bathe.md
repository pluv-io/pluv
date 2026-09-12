---
"@pluv/io": patch
"@pluv/crdt-yjs": patch
"@pluv/crdt-loro": patch
---

Loaded room storage is no longer overwritten when another client joins with `initialStorage`.

- Persistence and `getInitialStorage` take priority over a client's `initialStorage`. Joining an already-seeded room leaves that storage unchanged.
- The client's `$initialized` storage echo is ignored, so a local snapshot cannot replace server state after load.
- Two clients connecting at once only load `getInitialStorage` once. If they both try to seed an empty room, only the first `initialStorage` is applied.
- Yjs and Loro `toJson()` now return the document's actual contents, including when storage was loaded from an encoded snapshot instead of a schema.
