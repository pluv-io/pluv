---
"@pluv/react": minor
---

Moved `authEndpoint` and `wsEndpoint` from `createClient` to `createRoomBundle`.

```tsx
// Before
const client = createClient<typeof ioServer>({
    authEndpoint: (room: string) => "MY_AUTH_ENDPOINT",
    wsEndpoint: (room: string) => "MY_WS_ENDPOINT",
});

const { createRoomBundle } = createBundle(client);

const pluv = createRoomBundle({
    // ...
});

// After
const client = createClient<typeof ioServer>();

const { createRoomBundle } = createBundle(client);

const pluv = createRoomBundle({
    authEndpoint: ({ metadata, room }) => `https://${metadata.myApiUrl}/${room}`,
    wsEndpoint: ({ metadata, room }) => `wss://${metadata.myApiUrl}/${room}`,
    // Optioanl: You can also now require a metadata field for these endpoints
    metadata: z.object({
        myApiUrl: z.string(),
    }),
    // ...
});

<pluv.PluvRoomProvider
    // ...
    metadata={{
        myApiUrl: "www.pluv.io/api",
    }}
>
    <div />
</pluv.PluvRoomProvider>
```


