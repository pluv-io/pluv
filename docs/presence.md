# Presence

Presence allows users to see information pertaining to what others are doing, making it a crucial aspect to collaborative experiences.

## How to add presence to rooms

Define presence in the Pluv room bundle

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
export const PluvRoom = Pluv.createRoomBundle({
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

Mount a RoomProvider

```tsx
// ./MyPage.tsx

import { FC } from "react";
import { PluvRoom } from "./pluv";
import { MyRoom } from "./MyRoom";

export const MyPage: FC<Record<string, never>> = () => {
    return (
        <PluvRoom.PluvRoomProvider room="my-room-id">
            <MyRoom />
        <PluvRoom.PluvRoomProvider>
    );
};
```

Use presence hooks

```tsx
// ./MyRoom.tsx

import { FC, useEffect } from "react";
import { PluvRoom } from "./pluv";

export const MyRoom: FC<Record<string, never>> = () => {
    const [myPresence, updateMyPresence] = PluvRoom.usePluvMyPresence();
    const others = PluvRoom.usePluvOthers();

    useEffect(() => {
        const updateCursor = (event: MouseEvent) => {
            const x = event.pageX;
            const y = event.pageY;

            updateMyPresence({ cursor: { x, y } });
        };

        window.addEventListener("mousemove", onMouseMove);

        return () => {
            window.removeEventListener("mousemove", onMouseMove);
        };
    }, [updateMyPresence]);

    const cursor = myPresence?.cursor;

    return (
        <div>
            <div style={{ top: cursor?.y, left: cursor?.x }} />
            {others.map((other) => (
                <div
                    key={other.connectionId}
                    style={{
                        top: other.presence?.cursor?.y,
                        left: other.presence?.cursor?.x
                    }}
                />
            ))}
        </div>
    );
};
```
