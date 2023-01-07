# Custom Events

Custom events are non-special, regular WebSocket events as you would think of them from [socket.io](https://socket.io/docs/v4/listening-to-events/). They have an event name and some data. Pluv.IO supports regular events with E2E type-safety so that your server and client always stay in sync.

## How to use custom events

Chain events off your PluvIO instance.

```ts
// ./io.ts

import { createIO } from "@pluv/io";
import { platformNode } from "@pluv/platform-node";
import { z } from "zod";

export const io = createIO({
    platform: platformNode()
})
    // Receives messages with type "SEND_MESSAGE",
    // with data { message: string }
    .event("SEND_MESSAGE", {
        input: z.object({ message: z.string() }),
        // Sends messages with type "RECEIVE_MESSAGE",
        // with data: { message: string }
        resolver: ({ message }) => ({ RECEIVE_MESSAGE: { message } })
    })
    // Receives messages with type "ADD_GROCERY_LIST_ITEM",
    // with data: { name: string; count: number }
    .event("ADD_GROCERY_LIST_ITEM", {
        input: z.object({ name: z.string(), count: z.number() }),
        // Sends messages with type "RECEIVE_GROCERY_LIST_ITEM",
        // with data: { name: string; count: number }
        resolver: ({ name, count }) => ({ RECEIVE_GROCERY_LIST_ITEM: { name, count } }),
    })
    // Receives messages with type "FLIP_SWITCH",
    // with data: { on: boolean }
    .event("FLIP_SWITCH", {
        input: z.object({ on: z.boolean() }),
        // Sends messages with type "SWITCH_FLIPPED",
        // with data: { on: boolean }
        resolver: ({ on }) => ({ SWITCH_FLIPPED: { on } })
    });
```

Set IO types onto your Pluv client

```ts
// ./pluv.ts

import { createBundle, createClient } from "@pluv/react";
import { z } from "zod";
import { type io } from "./io";

const client = clientClient<typeof io>({
    authEndpoint: () => "{{your auth endpoint}}",
    wsEndpoint: () => "{{your ws endpoint}}",
});

export const Pluv = createBundle(client);
export const PluvRoom = Pluv.createRoomBundle();
```

Use event hooks

```tsx
// ./MyRoom.tsx

import { FC, useEffect } from "react";
import { PluvRoom } from "./pluv";

export const MyRoom: FC<Record<string, never>> = () => {
    const broadcast = PluvRoom.usePluvBroadcast();

    PluvRoom.usePluvEvent("RECEIVE_MESSAGE", (message) => {
        // message properties
        message.connectionId;
        message.data;
        message.room;
        message.type;
        message.user;

        // message.data is typed as { message: string }
        console.log(message.data.message);
    });

    PluvRoom.usePluvEvent("RECEIVE_GROCERY_LIST_ITEM", ({ data }) => {
        console.log(data.name, data.count);
    });

    PluvRoom.usePluvEvent("SWITCH_FLIPPED", ({ data }) => {
        console.log(data.on);
    });

    // These are also typed
    broadcast({
        type: "SEND_MESSAGE",
        data: { message: "hello world" },
    });

    broadcast({
        type: "ADD_GROCERY_LIST_ITEM",
        data: { name: "Milk", count: 2 },
    });

    broadcast({
        type: "FLIP_SWITCH",
        data: { on: false },
    });

    return <div />;
};
```
