---
"@pluv/types": major
"@pluv/io": major
"@pluv/client": major
---

Reading `$roomStats`, `$registered`, `$userJoined`, `$presenceUpdated`, and each `$othersReceived` entry breaks. `getRoomStats()` and `useRoomStats()` still return `{ connectionCount, userCount }` for the kinds you ask for.

`$exit` is unchanged. It still sends `sessionId`, `user`, and `operator`, with no `kind` and no `session`.

`$roomStats` is now keyed by kind. Each side is `{ connectionCount, userCount }`. The old top-level counts were only users, and operators were a nested copy of the same pair.

```ts
// Before
{
  connectionCount: 2,
  userCount: 1,
  operators: { connectionCount: 1, userCount: 1 },
}

// After
{
  user: { connectionCount: 2, userCount: 1 },
  operator: { connectionCount: 1, userCount: 1 },
}
```

`$registered` carries that same object on `stats`. Who you are is a `session`, not more fields beside the counts. `session` is only `kind`, `operator`, `presence`, and `seq`.

```ts
// Before
{
  connectionCount: 2,
  userCount: 1,
  operators: { connectionCount: 1, userCount: 1 },
  kind: "user",
  operator: null,
  presence: { name: "ada" },
  seq: { presence: 1 },
  sessionId: "session-1",
  state: null,
}

// After
{
  stats: {
    user: { connectionCount: 2, userCount: 1 },
    operator: { connectionCount: 1, userCount: 1 },
  },
  session: {
    kind: "user",
    operator: null,
    presence: { name: "ada" },
    seq: { presence: 1 },
  },
  sessionId: "session-1",
  state: null,
}
```

`$userJoined`, `$presenceUpdated`, and each `$othersReceived` entry use that same `session` object. The event's own fields stay beside it. `$userJoined` still has `connectionId` and `user`. `$presenceUpdated` still has `user`. An others entry still has `connectionIds` and `data`.

```ts
// Before
{
  connectionId: "session-2",
  user: { id: "ada" },
  kind: "user",
  operator: null,
  presence: { name: "ada" },
  seq: { presence: 1 },
}

// After
{
  connectionId: "session-2",
  user: { id: "ada" },
  session: {
    kind: "user",
    operator: null,
    presence: { name: "ada" },
    seq: { presence: 1 },
  },
}
```

`getRoomStats()` and `useRoomStats()` still return that pair for the kinds you ask for.

```ts
const { connectionCount, userCount } = room.getRoomStats();
const operatorCount = room.getRoomStats({ kinds: ["operator"] }).userCount;
```
