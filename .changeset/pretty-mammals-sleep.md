---
"@pluv/client": minor
---

Updated `presence` types to be more lenient (i.e. no-longer extends `JsonObject`). This is to enable types like `.passthrough` with zod, which can be useful for integrating `yjs.awareness` with libraries such as [lexical](https://lexical.dev/).
