# `createIO` API

> **Note**
> [yjs](https://www.npmjs.com/package/yjs) is a peer dependency, and should be installed to use this api.

```bash
# install yjs peer dependency
$ npm install yjs
```

1. [`createIO`](#createio)
   1. [`platform`](#platform-required)
   2. [`authorize`](#authorize-optional)
   3. [`context`](#context-optional)
   4. [`onStorageUpdated`](#onstorageupdated-optional)
   5. [`onRoomDeleted`](#onroomdeleted-optional)
   6. [`initialStorage`](#initialstorage-optional)
2. [`PluvIO`](#pluvio)
   1. [`createToken`](#createtoken)
   2. [`getRoom`](#getroom)

## `createIO`

Creates a [@pluv/io](https://www.npmjs.com/package/@pluv/io) instance to manage websockets and rooms.

`createIO` takes several options which should be specified by the user, detailed below:

### `platform` (required)

type `AbstractPlatform`

Specifies how the `PluvIO` instance can work with your selected runtime.

**Steps:**

```bash
# select and install your runtime platform

# Node.js
$ npm install @pluv/platform-node

# Cloudflare-workers
$ npm install @pluv/platform-cloudflare
```

```ts
// ./io.ts

// set your platform

import { createIO } from "@pluv/io";
import { platformNode } from "@pluv/platform-node";

export const io = createIO({
    platform: platformNode(),
});
```

### `authorize` (optional)

type `IOAuthorize`

Defines the authorization rules for rooms.

> **Note**
> [zod](https://www.npmjs.com/package/zod) is required to set this property.

```bash
# install zod
$ npm install zod
```

```ts
import { createIO } from "@pluv/io";
import { z } from "zod";

export const io = createIO({
    authorize: {
        // boolean
        // if true, a token will be required when registering a new
        // websocket
        required: true,
        // string
        // used to create an encryption secret when generating jwts
        secret: process.env.PLUV_AUTH_SECRET!,
        // zod validator object
        // used to define the shape of the user object. must contain
        // id at least
        user: z.object({
            // this property must be defined in your validator
            id: z.string(),
            // add any additional properties to the jwt
            // ...
        }),
    },
    /* ... */
});
```

### `context` (optional)

type: `JsonObject`

Allows passing additional values to event resolvers.

```ts
import { createIO } from "@pluv/io";
import { z } from "zod";
import { db } from "./db";

export const io = createIO({
    context: { db },
}).event("SEND_MESSAGE", {
    input: z.object({ message: z.string() }),
    resolver: ({ message }, { context, session }) => {
        context.db.update(/* whatever you need */)
        
        return { MESSAGE_RECEIVED: { message } };
    },
});
```

### `onStorageUpdated` (optional)

type `(room: string, encodedState: string) => void`

Listens to whenever a room's storage was updated. Can be used in tandem with the `initialStorage` parameter to persist a room's storage state.

```ts
import { createIO } from "@pluv/io";
import { db } from "./db";

export const io = createIO({
    onStorageUpdated: (room: string, encodedState: string) => {
        db.room.upsert({
            where: { room },
            create: { room, encodedState },
            update: { encodedState },
        });
    },
    /* ... */
});
```

### `onRoomDeleted` (optional)

type `(room: string, encodedState: string) => void`

Listens to whenever a room's last user leaves the room. Can be used in tandem with the `initialStorage` parameter to persist a room's storage state if the same room is recreated later on.

```ts
import { createIO } from "@pluv/io";
import { db } from "./db";

export const io = createIO({
    onRoomDeleted: (room: string, encodedState: string) => {
        db.room.upsert({
            where: { room },
            create: { room, encodedState },
            update: { encodedState },
        });
    },
    /* ... */
});
```

### `initialStorage` (optional)

type `(room: string) => string | null | Promise<string | null>`

Configures how to set the initial storage for a room. Function must return an encoded [yjs](https://yjs.dev/) document state as a string. Should generally return a previous snapshot of a storage state of the room, so that the client-side storage schema aligns.


```ts
import { createIO } from "@pluv/io";
import { db } from "./db";

export const io = createIO({
    initialStorage: async (room: string): Promise<string | null> => {
        const room = await db.room.findOne({ where: { room } });

        return room?.storage ?? null;
    },
    /* ... */
});
```

## `PluvIO`

The return type from `createIO`. This is used to create authorization tokens and register websockets.

### `createToken`

Creates a JWT that is used to authorize a user to a room. This should be used within an api endpoint the frontend client can call to obtain a token.

For more details, check out the [Authentication](https://github.com/pluv-io/pluv/blob/master/docs/authentication.md) docs.

```ts
// ./server.ts

import { io } from "./io";

/* ... */
app.get("/api/authorize", async (req, res) => {
    const room = req.query.room as string;

    const token = await io.createToken({
        room,
        user: {
            id: "user123",

            // add other properties defined in `createIO.authorize.user`
            name: "johnathan_doe",
        },
    });

    return res.send(token).status(200);
});
```

### `getRoom`

Creates a new room (or gets the old one if it exists). Websockets should be registered to the room immediately upon the room being retrieved.

For more details, check out the [Cloudflare Support](https://github.com/pluv-io/pluv/blob/master/docs/cloudflare-support.md) or [Node.js Support](https://github.com/pluv-io/pluv/blob/master/docs/nodejs-support.md) docs.

```ts
import http from "http";
import WebSocket from "ws";
import { io } from "./io";

const wsServer = new WebSocket.Server(/* websocket server config */);

const parseRoomId = (url: string): string => {
  /* get room from req.url */
};

const parseRoomToken = (url: string): string | undefined {
    /* get auth jwt from req.url */
};

wsServer.on("connection", async (ws, req) => {
  const roomId = parseRoomId(req.url);
  const token = parseRoomToken(req.url);

  // add `token` parameter if `createIO.authorize` was configured
  await io.getRoom(roomId).register(ws, { token });
});
```
