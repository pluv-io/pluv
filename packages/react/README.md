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
  <a href="https://www.npmjs.com/package/@pluv/react">
    <img src="https://img.shields.io/npm/v/@pluv/react" alt="npm @pluv/react" />
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

## `@pluv/react`

> [React.js](https://reactjs.org/) bindings for [@pluv/client](https://img.shields.io/npm/v/@pluv/client).

## Installation

```bash
# npm
npm install @pluv/react yjs

# yarn
yarn add @pluv/react yjs

# pnpm
pnpm add @pluv/react yjs
```

If you plan on using presence and/or storage, make sure to also install `zod`.

## Basic Example

```tsx
import { createBundle, createClient, y } from "@pluv/react";
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

export const {
    // factories
    createRoomBundle,

    // components
    PluvProvider,

    // hooks
    usePluvClient,
} = createBundle(client);

export const {
    // components
    PluvRoomProvider,

    // hooks
    usePluvBroadcast,
    usePluvConnection,
    usePluvEvent,
    usePluvMyPresence,
    usePluvMyself,
    usePluvOther,
    usePluvOthers,
    usePluvRoom,
    usePluvStorage,
} = createRoomBundle({
    initialStorage: () => ({
        messages: y.array([
            y.unstable__object({
                message: "Hello World!",
                name: "johnathan_doe",
            }),
        ]),
    }),
    presence: z.object({
        cursor: z.nullable(
            z.object({
                x: z.number(),
                y: z.number(),
            })
        ),
    }),
});

import { FC } from "react";

export const MyPage: FC<Record<string, never>> = () => {
    return (
        <PluvProvider>
            <MyRoom />
        </PluvProvider>
    );
};

export const MyRoom: FC<Record<string, never>> = () => {
    const broadcast = usePluvBroadcast();

    usePluvEvent("RECEIVE_MESSAGE", ({ data }) => {
        // data is typed as { message: string }
        console.log(data.message);
    });

    return (
        <button
            onClick={() => {
                broadcast("SEND_MESSAGE", {
                    // TypeScript will require that message is typed as string
                    message: "Hello world!",
                });
            }}
            type="button"
        >
            Send Message
        </button>
    );
};
```

## Reference

Check us out on [GitHub](https://github.com/pluv-io/pluv) for more information on how to use `@pluv/io`.
