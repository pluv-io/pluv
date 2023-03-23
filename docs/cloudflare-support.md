# Cloudflare Support

> **Note**
> This assumes that you already have a basic Cloudflare Worker configured.

These are some instructions on how to setup Pluv.IO for your project. Keep in mind that setup might differ based on your project's configuration; however these examples should still be relevant for setup.

## How to use PluvIO on Cloudflare

Install baseline @pluv/io dependencies

```bash
$ npm install @pluv/io yjs
```

Install Cloudflare specific dependencies

```bash
$ npm install @pluv/platform-cloudflare
```

Create PluvIO

```ts
// ./io.ts

import { createIO } from "@pluv/io";
import { platformCloudflare } from "@pluv/platform-cloudflare";

export const io = createIO({ platform: platformCloudflare() });
```

Create durable-object, register WebSocket to PluvIO.IORoom

```ts
// ./RoomDurableObject.ts

import { type InferIORoom } from "@pluv/io";

export class RoomDurableObject implements DurableObject {
  private _io: InferIORoom<typeof io>;

  constructor(state: DurableObjectState) {
    this._io = io.getRoom(state.id.toString());
  }

  async fetch(request: Request): Promise<Response> {
    const isWebSocketRequest = request.headers.get("Upgrade") === "WebSocket";

    if (!isWebSocketRequest) {
      return new Response("Expected WebSocket", { status: 400 });
    }

    const { 0: client, 1: server } = new WebSocketPair();

    await this._io.register(server);

    return new Response(null, { status: 101, webSocket: client });
  }
}
```
