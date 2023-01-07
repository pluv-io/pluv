# Authentication

## How to authenticate rooms

Pluv.io uses JWTs to authenticate access to rooms on a new connection. To generate a JWT, you will need to setup an authentication endpoint to determine if the user should have access to the room.

The examples below will use [express](https://expressjs.com/), but so long as you can create an http endpoint that can return text responses, these should still be relevant.

### Steps to authenticate a room

Enable authentication for the room

```ts
// ./io.ts

import { createIO } from "@pluv/io";
import { platformNode } from "@pluv/platform-node";
import { z } from "zod";

export const io = createIO({
    authorize: {
        // If required is false, users can authenticate for a room to attach
        // an identity to their presence, otherwise they will be anonymous.
        required: true,
        // The secret for generating your JWT
        secret: process.env.PLUV_AUTH_SECRET!,
        // The shape of your user object. `id` must always be required.
        user: z.object({
            id: z.string(),
            // Here is an additional field we wish to add
            name: z.string(),
        })
    },
    platform: platformNode(),
});
```

Setup your authentication endpoint on your server

```ts
// ./server.ts

import express from "express";
import { io } from "./io";

const app = express();

/* Set-up your websocket server and register websockets on io */
// ...

// Create a new authentication endpoint for your room
app.get("/api/authorize", async (req, res) => {
    /**
     * Configure your access logic here, using the cookies and headers of the
     * request to determine whether the user has access to this room.
     */

    const room = req.query.room as string;

    const token = await io.createToken({
        room,
        user: { id: "123", name: "johnathan_doe" }
    });

    return res.send(token).status(200);
});
```

Set your authentication endpoint on your client

```ts
// ./pluv.ts

import { createClient } from "@pluv/react";
import { type io } from "./io";

const client = createClient<typeof io>({
    authEndpoint: (room) => {
        return `${window.origin}/api/authorize?room=${room}`;
    },
    wsEndpoint: (room) => {
        return "{{your websocket endpoint}}";
    },
});

```
