# Creating Rooms

The examples below will cover how to create rooms within [React](https://reactjs.org/). If you want to see how to create rooms and register websockets on the server. Check out the docs for [Node.js support](https://github.com/pluv-io/pluv/blob/master/docs/nodejs-support.md) and [Cloudflare support](https://github.com/pluv-io/pluv/blob/master/docs/cloudflare-support.md)

### Steps to create rooms in React

Create your room module

```ts
// ./pluv.ts

import { createBundle, createClient } from "@pluv/react";
import { type io } from "./io";

const client = createClient<typeof io>({
    authEndpoint: () => "{{your auth endpoint}}",
    wsEndpoint: () => "{{your ws endpoint}}",
});

export const Pluv = createBundle(client);
export const PluvRoom = Pluv.createRoomBundle();

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

Use room hooks

```tsx
// ./MyPage.tsx

import { FC } from "react";
import { PluvRoom } from "./pluv";

export const MyRoom: FC<Record<string, never>> = () => {
    const broadcast = PluvRoom.usePluvBroadcast();

    return <div />;
};

```
