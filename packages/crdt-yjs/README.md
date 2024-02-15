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
  <a href="https://www.npmjs.com/package/@pluv/crdt-yjs">
    <img src="https://img.shields.io/npm/v/@pluv/crdt-yjs" alt="npm @pluv/crdt-yjs" />
  </a>
  <a href="https://github.com/pluv-io/pluv/blob/master/LICENSE">
    <img alt="GitHub" src="https://img.shields.io/github/license/pluv-io/pluv" alt="License MIT" />
  </a>
  <a href="https://commitizen.github.io/cz-cli/">
    <img src="https://img.shields.io/badge/commitizen-friendly-brightgreen.svg" alt="Commitizen friendly" />
  </a>
  <img src="https://badgen.net/badge/-/TypeScript?icon=typescript&label&labelColor=blue&color=555555" alt="TypeScript" />
</p>

## `@pluv/crdt-yjs`

> Yjs adapter for [@pluv/client](https://www.npmjs.com/package/@pluv/client) and [@pluv/io](https://www.npmjs.com/package/@pluv/io).

**👉 See full documentation on [pluv.io](https://pluv.io/docs/introduction). 👈**

## Installation

> **Note**
> This package is already re-exported from @pluv/client, @pluv/react and @pluv/io as `y`, so you likely do not need to install this directly.

```bash
# npm
npm install @pluv/crdt-yjs yjs

# yarn
yarn add @pluv/crdt-yjs yjs

# pnpm
pnpm add @pluv/crdt-yjs yjs
```

## Basic Example

```ts
import { createClient } from "@pluv/client";
import { yjs } from "@pluv/crdt-yjs";
import { z } from "zod";
// Import the PluvIO instance as a type from your server file
import { type io } from "./server";

const client = createClient<typeof io>({ /* client config here */ });

// Create a room to join
const room = client.createRoom("my-room", {
    initialStorage: yjs.doc(() => ({
        editor: yjs.xmlFragment({
            children: [
                yjs.xmlElement("paragraph", {
                  children: [yjs.xmlText("Hello World!")],
                }),
            ]
        }),
        groceryList: yjs.map([
            ["apricots", 2],
            ["bread", 3],
            ["cheese", 5],
        ]),
        messages: yjs.array([]),
    })),
    presence: z.object({}),
});
```

## Reference

Check us out on [GitHub](https://github.com/pluv-io/pluv) for more information on how to use `@pluv/io`.

