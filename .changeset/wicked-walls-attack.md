---
"@pluv/react": patch
---

Add support for a passing either a function or object for the `metadata` prop on `PluvRoomProvider`. When a function is used, the `metadata` will be gotten at the moment of connection (internally this is a `useEffect`, so browser APIs can be used such as `document`, `window` and `localStorage`).

```tsx
// Both of these work
<PluvRoomProvider metadata={{ hello: "world" }}>
    {children}
</PluvRoomProvider>

<PluvRoomProvider
    metadata={() => {
        const value = localStorage.get(MY_LOCALSTORAGE_KEY);

        return { hello: value };
    }}
>
    {children}
</PluvRoomProvider>
```
