> **Disclaimer:**
> This package is currently in preview and may have breaking changes between versions. Please wait for a `v1.0.0` stable release before using this in production.

<h1 align="center">
  <br>
  <img src="https://github.com/pluv-io/pluv/blob/master/assets/pluv-icon-192x192.png?raw=true" alt="Pluv.IO" width="180" style="border-radius:16px">
  <br>
  Pluv.IO (preview)
  <br>
</h1>

<h3 align="center">Multi-platform, E2E type-safe realtime packages</h3>
<h4 align="center">💕 Inspired by <a href="https://trpc.io">trpc</a> 💕 Built with <a href="https://docs.yjs.dev/">yjs</a> 💕</h4>

<p align="center">
  <a href="https://www.npmjs.com/package/@pluv/client">
    <img src="https://img.shields.io/npm/v/@pluv/client" alt="npm @pluv/client" />
  </a>
  <a href="https://github.com/pluv-io/pluv/blob/master/LICENSE">
    <img alt="GitHub" src="https://img.shields.io/github/license/pluv-io/pluv" alt="License MIT" />
  </a>
  <img src="https://badgen.net/badge/-/TypeScript?icon=typescript&label&labelColor=blue&color=555555" alt="TypeScript">
  <a href="https://commitizen.github.io/cz-cli/">
    <img src="https://img.shields.io/badge/commitizen-friendly-brightgreen.svg" alt="Commitizen friendly" />
  </a>
  <img src="https://img.shields.io/badge/docs-coming%20soon!-blue" alt="Docs coming soon!" />
</p>

<p align="center">
  <img src="https://github.com/pluv-io/pluv/blob/master/assets/demo-events.gif?raw=true" alt="Demo" />
</p>

## `@pluv/client`

> Framework agnostic frontend client for [@pluv/io](https://img.shields.io/npm/v/@pluv/io)

## Installation

```bash
# npm
npm install @pluv/client yjs

# yarn
yarn add @pluv/client yjs

# pnpm
pnpm add @pluv/client yjs
```

If you plan on using presence and/or storage, make sure to also install `zod`.

## Basic Example

```ts
import { createClient, y } from "@pluv/client";
import { z } from "zod";
// Import the PluvIO instance as a type from your server file
import { type io } from "./server";

// Initialize the @pluv/client client
const client = createClient<typeof io>({
    authEndpoint: (room) => {
        return `https://localhost:3000/api/authorize?room=${room}`;
    },
    wsEndpoint: (room) => {
        return `ws://localhost:3000/api/room/${room}`;
    },
});

interface Presence {
    cursor: { x: number; y: number } | null;
}

interface Storage {
    messages: readonly { name: string; message: string }[]
}

// Create a room to join
const room = client.createRoom<Presence, Storage>("my-room", {
    initialPresence: { cursor: null },
    initialStorage: () => ({ messages: y.array([]) }),
    onAuthorizationFail: (error) => {
        console.log(error.message);
    },
    presence: z.object({
        cursor: z.nullable(
            z.object({
                x: z.number(),
                y: z.number(),
            })
        ),
    }),
});

const main = async () => {
    await client.enter(room);

    const unsubscribe = client.event("RECEIVE_MESSAGE", ({ data }) => {
        console.log(data.message);
    });

    client.broadcast({
        type: "SEND_MESSAGE",
        data: { message: "Hello world!" },
    });

    unsubscribe();

    client.leave(room);
};
```

## Reference

Check us out on [GitHub](https://github.com/pluv-io/pluv) for more information on how to use `@pluv/io`.
