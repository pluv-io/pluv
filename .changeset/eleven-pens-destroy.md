---
"@pluv/react": patch
---

Update the `updateMyPresence` function from `useMyPresence` to simply forward the function from the `PluvRoom`. This means all `updateMyPresence` functions should be the same underlying reference across all `useMyPresence` hooks.
