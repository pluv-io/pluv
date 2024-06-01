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
  <a href="https://www.npmjs.com/package/@pluv/react">
    <img src="https://img.shields.io/npm/v/@pluv/react" alt="npm @pluv/react" />
  </a>
  <a href="https://github.com/pluv-io/pluv/blob/master/LICENSE">
    <img alt="GitHub" src="https://img.shields.io/github/license/pluv-io/pluv" alt="License MIT" />
  </a>
  <a href="https://commitizen.github.io/cz-cli/">
    <img src="https://img.shields.io/badge/commitizen-friendly-brightgreen.svg" alt="Commitizen friendly" />
  </a>
  <img src="https://badgen.net/badge/-/TypeScript?icon=typescript&label&labelColor=blue&color=555555" alt="TypeScript" />
</p>

## `@pluv/react`

> [React.js](https://reactjs.org/) bindings for [@pluv/client](https://www.npmjs.com/package/@pluv/client).

**👉 See full documentation on [pluv.io](https://pluv.io/docs/introduction). 👈**

## Installation

```bash
# npm
npm install @pluv/react @pluv/crdt-yjs yjs zod

# yarn
yarn add @pluv/react @pluv/crdt-yjs yjs zod

# pnpm
pnpm add @pluv/react @pluv/crdt-yjs yjs zod
```

## Basic Example

```tsx
import { yjs } from "@pluv/crdt-yjs";
import { createBundle, createClient } from "@pluv/react";
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
    useClient,
} = createBundle(client);

export const {
    // components
    MockedRoomProvider,
    PluvRoomProvider,

    // utils
    event,

    // hooks
    useBroadcast,
    useCanRedo,
    useCanUndo,
    useConnection,
    useDoc,
    useEvent,
    useMyPresence,
    useMyself,
    useOther,
    useOthers,
    useRedo,
    useRoom,
    useStorage,
    useTransact,
    useUndo,
} = createRoomBundle({
    initialStorage: yjs.doc(() => ({
        messages: yjs.array([
            yjs.object({
                message: "Hello World!",
                name: "johnathan_doe",
            }),
        ]),
    })),
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
    const broadcast = useBroadcast();

    event.RECEIVE_MESSAGE.useEvent(({ data }) => {
        // data is typed as { message: string }
        console.log(data.message);
    });

    return (
        <button
            onClick={() => {
                broadcast.SEND_MESSAGE({
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
