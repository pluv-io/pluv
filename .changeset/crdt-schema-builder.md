---
"@pluv/client": major
"@pluv/react": major
"@pluv/crdt": major
"@pluv/crdt-yjs": major
"@pluv/crdt-loro": major
"@pluv/types": major
---

Replace `yjs.doc((t) => …)` / `loro.doc((t) => …)` with a schema builder and JSON seeds.

`createClient` now takes `storage: yjs.storage({ schema: yjs.schema({ … }) })` (or Loro) plus an optional JSON `initialStorage`. Room-level `initialStorage` is JSON only, not a builder. `useStorage` and `getStorage` return native Yjs/Loro types instead of `YjsType` / `LoroType` wrappers. `CrdtType` and `InferCrdtJson` are removed.
