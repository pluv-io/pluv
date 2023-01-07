# CRDT Storage

Pluv.IO uses [yjs](https://yjs.dev/) to enable easy shared data manipulation between participants of the same room. There are also existing integrations with yjs that make it simpler to create a shared experience like a [collaborative rich-text editor](https://docs.yjs.dev/ecosystem/editor-bindings).

## How to use Yjs with Pluv.IO

Install yjs

> **Note**
> Yjs is a peer dependency of pluv packages, so make sure to install wherever the server and/or client are located (in both places if these are separate). This is currently necessary even if you are not using yjs in your setup.

```bash
$ npm install yjs
```

Setup Pluv Client with initial yjs storage

```ts
import { createBundle, createClient, y } from "@pluv/react";
import { z } from "zod";
import { type io } from "./io";

const client = clientClient<typeof io>({
    authEndpoint: () => "{{your auth endpoint}}",
    wsEndpoint: () => "{{your ws endpoint}}",
});

export const Pluv = createBundle(client);
export const PluvRoom = Pluv.createRoomBundle({
    // Defines the initial value and types for the room's storage
    // We will have the opportunity to modify these initial values
    // later on, so think of these as just types if needed.
    initialStorage: () => ({
        messages: y.array([
            y.unstable__object({
                message: "Hello world!",
                name: "johnathan_doe",
            }),
        ]),
    }),
});
```

Mount a RoomProvider, modify initial storage if needed

```tsx
// ./MyPage.tsx

import { FC } from "react";
import { PluvRoom } from "./pluv";
import { MyRoom } from "./MyRoom";

export const MyPage: FC<Record<string, never>> = () => {
    return (
        <PluvRoom.PluvRoomProvider
            // Optional, if only we wish to override initialStorage for the room
            initialStorage={() => ({
                messages: y.array([]),
            })}
            room="my-room-id"
        >
            <MyRoom />
        <PluvRoom.PluvRoomProvider>
    );
};
```

Use storage hooks

```tsx
// ./MyRoom.tsx

import { FC, useEffect } from "react";
import { PluvRoom } from "./pluv";

export const MyRoom: FC<Record<string, never>> = () => {
    const [messages, sharedType] = PluvRoom.usePluvStorage("messages");

    // This is the yjs shared type to mutate the data
    sharedType?.push([{
        name: "johnathan_doe",
        message: "Hi, I am Mr. Doe",
    }]);

    return (
        <div>
            {messages?.map((message, i) => (
                <div key={i}>{message.name}: {message.mesage}</div>
            ))}
        </div>
    );
};
```