---
"@pluv/client": minor
"@pluv/react": minor
---

**BREAKING**
Update `authEndpoint` and `wsEndpoint` to now use a parameterized object that passes through additional data via a `metadata` property.

```tsx
// Before

import { env } from "./env";
import type { ioServer } from "./server";

const client = createClient<typeof ioServer>({
    authEndpoint: (room: string) => `${env.API_URL}}/room/${room}`,
    wsEndpoint: (room: string) => `${env.WS_URL}/room/${room}`,
});

// After

const client = createClient<
    typeof ioServer,
    // Optional: You can specify types for metadata here. This is useful for Cloudflare Pages
    { apiUrl: string; wsUrl: string }
>({
    authEndpoint: ({ metadata, room }) => `${metadata.apiUrl}}/room/${room}`,
    wsEndpoint: ({ metadata, room }) => `${{ metadata.wsUrl }}/room/${room}`,
});

client.createRoom("my-room", {
    // This property exists when the `metadata` generic type is defined above
    metadata: {
        apiUrl: "https://example.com/api",
        wsUrl: "wss://example.com/api",
    },
    // ...
});

<PluvRoomProvider
    // This property exists when the `metadata` generic type is defined above
    metadata={{
        apiUrl: "https://example.com/api",
        wsUrl: "wss://example.com/api",
    }}
>
    {/* ... */}
</PluvRoomProvider>
```
