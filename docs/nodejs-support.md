# Node.js Support

> **Note**
> This assumes that you already have a basic Node.js application configured.

These are some instructions on how to setup Pluv.IO for your project. Keep in mind that setup might differ based on your project's configuration; however these examples should still be relevant for setup.

## How to use PluvIO on Node.js

Install baseline @pluv/io dependencies

```bash
$ npm install @pluv/io yjs
```

Install Node.js specific dependencies

```bash
$ npm install @pluv/platform-node ws @types/ws
```

Create PluvIO

```ts
// ./io.ts

import { createIO } from "@pluv/io";
import { platformNode } from "@pluv/platform-node";

export const io = createIO({ platform: platformNode() });
```

Create server, register WebSocket to PluvIO.IORoom

```ts
// ./server.ts

import express from "express";
import Http from "http";
import WebSocket from "ws";
import { io } from "./io";

const app = express();
const server = Http.createServer();
const wsServer = new WebSocket.Server({ server });

const parseRoomId = (url: string): string => {
  /* get room from req.url */
};

wsServer.on("connection", async (ws, req) => {
  const roomId = parseRoomId(req.url);
  const room = io.getRoom(roomId);

  await room.register(ws);
});
```
