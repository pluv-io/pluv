# React API

This documents the api that comes out of the modules created by `createBundle` and `createRoomBundle`.

## How to create a Pluv React bundle

```ts
// ./pluv.ts

import { createBundle, createClient } from "@pluv/react";
import { z } from "zod";
import { type io } from "./io";

const client = clientClient<typeof io>({
    authEndpoint: () => "{{your auth endpoint}}",
    wsEndpoint: () => "{{your ws endpoint}}",
});

export const {
    // factories
    createRoomBundle,

    // components
    PluvProvider,

    // hooks
    usePluvClient,
} = createBundle(client);

export const {
    // components
    PluvRoomProvider,

    // hooks
    usePluvBroadcast,
    usePluvConnection,
    usePluvEvent,
    usePluvMyPresence,
    usePluvMyself,
    usePluvOther,
    usePluvOthers,
    usePluvRoom,
    usePluvStorage,
} = createRoomBundle();
```

## `createBundle` module API

### `createRoomBundle`

**Description:**

This is a factory to create a client-side PluvIO room module.

**Example:**

```ts
export const PluvRoom = createRoomBundle({
    initialStorage: () => ({
        messages: y.array([
            y.unstable__object({
                message: "Hello World!",
                name: "johnathan_doe",
            }),
        ]),
    }),
    presence: z.object({
        cursor: z.nullable(
            z.object({
                x: z.number(),
                y: z.number(),
            })
        ),
    }),
});
```

### `PluvProvider`

**Description:**

This provider is not necessary. Use this provider if you wish to access the Pluv client via `usePluvClient`.

**Example:**

```ts
export const MyPage: FC<Record<string, never>> = () => {
    return (
        <PluvProvider>
            <MyRoom />
        </PluvProvider>
    );
};
```

### `usePluvClient`

**Description:**

If your component has been wrapped with `PluvProvider`, you can access the PluvClient directly via this hook.

**Example:**

```ts
export const MyPage: FC<Record<string, never>> = () => {
    const client = usePluvClient();

    return <div />;
};
```

## `createRoomBundle` module API

### `PluvRoomProvider`

**Description:**

When this provider is mounted, all of the hooks from this bundle become usable in the child react tree, and the user joins the room as an active WebSocket connection. When the component unmounts, the user leaves the room.

> **Note**
> You may not have multiple PluvRoomProvider components mounted at the same time with the same `room` attribute within your app.

**Example:**

```ts
export const MyPage: FC<Record<string, never>> = () => {
    return (
        <PluvRoomProvider room="my-room-id">
            <MyRoom />
        </PluvRoomProvider>
    );
};
```

## `usePluvBroadcast`

**Description:**

Returns a function that broadcasts an event to all connections in the same room.

**Example:**

```ts
const io = createIO({
    platform: platformNode()
}).event("SEND_MESSAGE", {
    input: z.object({ message: z.string() }),
    resolver: ({ message }) => ({ RECEIVE_MESSAGE: { message } })
});
```

```ts
const broadcast = usePluvBroadcast();

broadcast({
    type: "SEND_MESSAGE",
    data: {
        // TypeScript will require that message is typed as string
        message: "Hello world!",
    }
});
```

## `usePluvConnection`

**Description:**

Returns the current connection state. Can optionally provide a function argument
to filter the fields returned by the hook to reduce potential rerenders.

**Example:**

```ts
const connection = usePluvConnection();

console.log(connection.id);
console.log(connection.state);

const connectionId = usePluvConnection((connection) => connection.id);

console.log(connectionId);
```

## `usePluvEvent`

**Description:**

Defines a listener for an event defined by PluvIO.

**Example:**

```ts
const io = createIO({
    platform: platformNode()
}).event("SEND_MESSAGE", {
    input: z.object({ message: z.string() }),
    resolver: ({ message }) => ({ RECEIVE_MESSAGE: { message } })
});
```

```ts
usePluvEvent("RECEIVE_MESSAGE", ({ data }) => {
    // data is typed as { message: string }
    console.log(data.message);
});
```

## `usePluvMyPresence`

**Description:**

Returns the user's presence and a function to update top-level properties of
their presence. Optionally accepts a function argument to filter fields and
reduce rerenders.

**Example:**

```ts
const { usePluvMyPresence } = createRoomBundle({
    presence: z.object({
        cursor: z.nullable(
            z.object({
                x: z.number(),
                y: z.number(),
            }),
        ),
        focusedElement: z.object({
            id: z.nullable(z.string())
        }),
    }),
});
```

```ts
const [myPresence, updateMyPresence] = usePluvMyPresence()

updateMyPresence({
    focusedElement: { id: "name-input" },
});

updateMyPresence({
    cursor: { x: 50, y: 100 },
});

// filter returned fields to reduce rerenders as well

const [myCursor, updateMyPresence] = usePluvMyPresence((presence) => presence.cursor);

// If you don't need the current presence, return a stable value

const [, updateMyPresence] = usePluvMyPresence(() => 1);
```

## `usePluvMyself`

**Description:**

Returns the user's presence, connection data, and user data (if authenticated).

**Example:**

```ts
const me = usePluvMyself()

// This can be null if the user is still connecting to the room
if (!me) return null;

console.log(me.connectionId);
// This will be typed according to your room's `presence` parameter.
console.log(me.presence);
// This will be typed according to your PluvIO's `authorize` parameter.
console.log(me.user);

// Filter returned fields to reduce rerenders as well
const myPresence = usePluvMyself((me) => me.presence);
```

## `usePluvOther`

**Description:**

Returns the user for a given `connectionId`. This has the same interface as
`usePluvMyself`, with accepting an initial `connectionId` string argument.

**Example:**

```ts
const user = usePluvOther("userId123");

// This user might not be connected or not exist
if (!user) return null;

console.log(user.connectionId);
// This will be typed according to your room's `presence` parameter.
console.log(user.presence);
// This will be typed according to your PluvIO's `authorize` parameter.
console.log(user.user);

// filter returned fields to reduce rerenders as well
const presence = usePluvOther("userId123", (me) => me.presence);
```

## `usePluvOthers`

**Description:**

Returns all users that are connected to the room excluding the current user.
Optionally accepts a function argument to filter fields and reduce rerenders.

> **Note**
> It is suggested that you always provide a selector argument to limit rerenders.
> You can map others to connectionIds, then use `usePluvOther` in another component
> to limit rerenders to the individual users that are updating.

**Example:**

```ts
const others = usePluvOthers();

others.forEach((other) => {
    console.log(user.connectionId);
    // This will be typed according to your room's `presence` parameter.
    console.log(user.presence);
    // This will be typed according to your PluvIO's `authorize` parameter.
    console.log(user.user);
});

// Filter returned fields to reduce rerenders as well
const connectionIds = usePluvOther((other) => other.connectionIds);
```

## `usePluvRoom`

**Description:**

Returns the instance of the current PluvRoom. This is primarily useful when
needing to pull the current room's id.

**Example:**

```ts
const room = usePluvRoom();

// Pull the id of the current room.
console.log(room.id);
```

## `usePluvStorage`

**Description:**

Returns the data for a root type of the room's storage, and the yjs shared type
to mutate it. Optionally accepts a function argument to filter fields and
reduce rerenders.

**Example:**

```ts
const { PluvRoomProvider, usePluvStorage } = createRoomBundle({
    initialStorage: () => ({
        messages: y.array([
            y.unstable__object({
                message: "Hello world!",
                name: "johnathan_doe",
            }),
        ]),
        count: 0,
    }),
});
```

```tsx
<PluvRoomProvider
    initialStorage={() => ({
        messages: y.array([]),
        count: 0,
    })}
    room="my-room"
>
    <MyRoom />
</PluvRoomProvider>
```

```tsx
const [messages, sharedType] = usePluvStorage("messages");

messages?.forEach(({ message, name }) => {
    console.log(`${name}: ${message}`);
});

sharedType?.push([
    y.unstable__object({
        message: "Hello world",
        name: "johnathan_doe",
    })
]);

// Filter returned fields to reduce rerenders as well
const [messages, sharedType] = usePluvStorage("messages", (data) => {
    return data.map((item) => item.message);
});

messages?.forEach((message)) => {
    console.log(message.toLowerCase());
});

// Shared type is unchanged, even when filtered
sharedType?.push([
    y.unstable__object({
        message: "Hello world",
        name: "johnathan_doe",
    })
]);
```
