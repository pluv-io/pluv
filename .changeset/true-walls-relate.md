---
"@pluv/io": minor
---

**BREAKING** Added the ability to configure the limits for user object size, presence size, and user id length. User id is now defaulted to be limited to 128 characters. To unset this limit, you can set this limit to `0` or `null`.

```ts
// Defaults
createIO({
    limits: {
        presenceMaxSize: 512,
        storageMaxSize: 31_457_280,
        userIdMaxLength: 128,
        userMaxSize: 512,
    },
});
```
