---
"@pluv/types": major
"@pluv/io": major
"@pluv/client": major
"@pluv/react": major
"@pluv/crdt-yjs": major
"@pluv/platform-cloudflare": major
---

`UserInfo` is keyed by person, and rooms expose size without listing everyone.

- `UserInfo` is `{ data, presence }`. Look up others by `data.id` (`useOther` / `getOther`), not a WebSocket connection id. `getOtherByConnectionId` maps a socket id to that person.

```ts
// Before
useOther(connectionId, (other) => other.presence.cursor);
useMyself(({ user }) => user.id);

// After
useOther(userId, (other) => other.presence.cursor);
useMyself(({ data }) => data.id);
```

- `useOthers()` / `getOthers()` still list everyone else who has presence.

```ts
// Before
others.map((other) => (
  <Cursor key={other.connectionId} user={other.user} />
));

// After
others.map((other) => (
  <Cursor key={other.data.id} user={other.data} />
));
```

- `useRoomStats()` / `getRoomStats()` report live `connectionCount` and `userCount` (including you). Use `userCount` for a viewer count; `useOthers().length` does not include you.

```ts
const { connectionCount, userCount } = useRoomStats();

const viewers = useRoomStats((stats) => stats.userCount);
const stats = room.getRoomStats(); // { connectionCount, userCount }
```

- `room.listUsers({ cursor, limit })` pages everyone currently in the room (including you), identities only, on both the client room and server `IORoom`. It is not a live store: people who join or leave while you page can be skipped or duplicated. `limit` defaults to 50 and must be an integer from 1 to 100. Returns `{ success: true, users, pageInfo }` or `{ success: false, error: { code, message } }`. Client `listUsers` can also fail with `FAILED` if the request times out.

```ts
const room = useRoom();

const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
    queryKey: ["listUsers", room.id],
    queryFn: async ({ pageParam }) => {
        const result = await room.listUsers({ cursor: pageParam, limit: 50 });

        if (!result.success) throw new Error(result.error.message);

        return result;
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => {
        return lastPage.pageInfo.hasNextPage ? lastPage.pageInfo.endCursor : undefined;
    },
});
// result.users: { data }[]
// result.pageInfo: { endCursor, hasNextPage }
```

- Rooms default `maxConnections` to 256. Extra sockets are rejected. Raise `limits.maxConnections` for larger rooms; large values also require `limits.dangerouslyAllowHighPresenceFanout: true`.
