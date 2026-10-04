---
"@pluv/types": major
"@pluv/io": major
"@pluv/client": major
"@pluv/react": major
"@pluv/treaty": major
"@pluv/platform-pluv": major
"@pluv/platform-node": major
"@pluv/platform-cloudflare": major
---

Operators can join a room without appearing as users.

User lists and counts stay the users in the room. Operators show up only when you ask for them. `listUsers` stays users only.

```ts
const users = useOthers();
const operators = useOthers((others) => others, { kinds: ["operator"] });
const operatorCount = useRoomStats((stats) => stats.userCount, { kinds: ["operator"] });
```

```ts
const operators = room.getOthers({ kinds: ["operator"] });
const operatorCount = room.getRoomStats({ kinds: ["operator"] }).userCount;
```

To let an owner in, set `onGetOperator` on `io.server()` and mint with `ioServer.createToken`. The hook returns the treaty user for that owner, and that user is stored on the token. If the hook is missing, returns `null`, or that user is invalid, the token is refused. Connect reads the sealed user until the token expires. Hosted `@pluv/platform-pluv` cannot mint these tokens.

```ts
export const ioServer = io.server({
    onGetOperator: ({ room, operator }) => {
        if (!canOperate(room, operator.id)) return null;

        return { id: `owner:${operator.id}`, name: operator.name };
    },
});

const token = await ioServer.createToken({
    request,
    room,
    kind: "operator",
    operator: {
        id: owner.id,
        name: owner.name,
        email: owner.email,
        imageUrl: owner.imageUrl,
    },
});
```

`getOther` and `useOther` take that user's id for both kinds. Pass `{ kind: "operator" }` for the operator. Omit `kind` and a person who is only an operator is null. Resolvers still receive `user`, and receive `operator` when the caller is an operator. `operator` is `id`, `name`, and `imageUrl`. `email` is only passed to `onGetOperator` while minting. Connect reads the treaty user from the token. An open socket keeps that answer until it disconnects. `user.id` is whoever the hook returns, so use an id that is not a live user's unless they are the same person.

```ts
t.procedure.presence.resolve((_input, { user, operator }) => {
    // operator is null for users
});
```
