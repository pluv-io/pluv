---
"@pluv/io": patch
---

Re-export `@pluv/types` symbols (`IOAuthorize`, `CrdtDocFactory`, `InferIOAuthorize`, and related types) from `@pluv/io`, and `CrdtDocFactory` from `@pluv/crdt`, so wrapper packages that emit declarations can import portable types through the public API instead of reaching into `@pluv/types`.

Upgrade the monorepo to TypeScript 7 for package builds and type tests.
