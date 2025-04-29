---
"@pluv/client": patch
---

Added configurable limits for client-side validation. These should only be updated if you control the server and the server limits have been changed.

```ts
// defaults
createClient({
    limits: {
        presenceMaxSize: 512,
    },
});
```
