> **Disclaimer:**
> This package is currently in preview and may have breaking changes between versions. Please wait for a `v1.0.0` stable release before using this in production.

<h1 align="center">
  <br />
  <img src="https://github.com/pluv-io/pluv/blob/master/assets/pluv-icon-192x192.png?raw=true" alt="Pluv.IO" width="180" style="border-radius:16px" />
  <br />
  <a href="https://pluv.io/docs/introduction">Pluv.IO (preview)</a>
  <br />
</h1>

<h3 align="center">Multi-platform, E2E type-safe realtime packages</h3>
<h4 align="center">💕 Inspired by <a href="https://trpc.io">trpc</a> 💕 <a href="https://docs.yjs.dev/">yjs</a> 💕 and <a href="https://developers.cloudflare.com/">Cloudflare</a> 💕 </h4>

<p align="center">
  <a href="https://www.npmjs.com/package/@pluv/platform-node">
    <img src="https://img.shields.io/npm/v/@pluv/platform-node" alt="npm @pluv/platform-node" />
  </a>
  <a href="https://github.com/pluv-io/pluv/blob/master/LICENSE">
    <img alt="GitHub" src="https://img.shields.io/github/license/pluv-io/pluv" alt="License MIT" />
  </a>
  <a href="https://commitizen.github.io/cz-cli/">
    <img src="https://img.shields.io/badge/commitizen-friendly-brightgreen.svg" alt="Commitizen friendly" />
  </a>
  <img src="https://badgen.net/badge/-/TypeScript?icon=typescript&label&labelColor=blue&color=555555" alt="TypeScript" />
</p>

## `@pluv/platform-node`

> Enables [@pluv/io](https://www.npmjs.com/package/@pluv/io) to run on [Node.js](https://nodejs.org/).

**👉 See full documentation on [pluv.io](https://pluv.io/docs/introduction). 👈**

## Installation

```bash
# npm
npm install @pluv/platform-node ws @types/ws

# yarn
yarn add @pluv/platform-node ws @types/ws

# pnpm
pnpm add @pluv/platform-node ws @types/ws
```

## Basic Example

```ts
import { createIO } from "@pluv/io";
import { platformNode } from "@pluv/platform-node";
import Http from "http";
import WebSocket from "ws";

export const io = createIO({ platform: platformNode() });
export const ioServer = io.server();

const server = Http.createServer();
const wsServer = new WebSocket.Server({ server });

const parseRoomId = (url: string): string => {
  /* get room from req.url */
};

wsServer.on("connection", async (ws, req) => {
  const roomId = parseRoomId(req.url);
  const room = ioServer.getRoom(roomId);

  await room.register(ws);
});
```

## Reference

Check us out on [GitHub](https://github.com/pluv-io/pluv) for more information on how to use `@pluv/io`.
