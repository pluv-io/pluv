---
"@pluv/io": minor
---

**BREAKING** Added a configurable limit for the max-size (in bytes) for storage (defaulting to 30MB). To unset this limit, you can set this limit to `0` or `null`.

```ts
io.server({
    limits: {
        storageMaxSize: null,
    },
});
```
