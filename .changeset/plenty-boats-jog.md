---
"@pluv/react": minor
---

Renamed all hooks from `@pluv/react` to be simply prefixed with `use` instead of `usePluv` (e.g. `usePluvStorage` is now just `useStorage`).

Hooks can be aliased to retain the same names if preferred:

```ts
export const {
    // ...
    useStorage: usePluvStorage,
    useTransact: usePluvTransact,
    // ...
} = createRoomBundle(/* */);
```
