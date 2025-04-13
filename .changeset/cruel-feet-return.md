---
"@pluv/react": minor
---

**BREAKING** Update the context value of `MockedRoomContext` to mirror the same shape as `PluvRoomContext`. i.e. the value of `MockedRoomContext` is now the room itself, rather than an object containing the room. This should not be breaking in most cases. If you happen to be using `useContext(MockedRoomContext)`, those will need to be updated as shown below:

```tsx
// Before
const { room } = useContext(MockedRoomContext);

// After
const room = useContext(MockedRoomContext);
```
