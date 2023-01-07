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
  <a href="https://www.npmjs.com/package/@pluv/crdt-yjs">
    <img src="https://img.shields.io/npm/v/@pluv/crdt-yjs" alt="npm @pluv/crdt-yjs" />
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
  <a href="#intro">Intro</a> •
  <a href="#usage">Usage</a> •
  <a href="#credits">Credits</a> •
  <a href="#related">Related</a> •
  <a href="#license">License</a>
</p>

<img src="https://github.com/pluv-io/pluv/blob/master/assets/demo-events.gif?raw=true" alt="Demo" />

## `@pluv/crdt-yjs`

> Yjs adapter for [@pluv/client](https://img.shields.io/npm/v/@pluv/client) and [@pluv/io](https://img.shields.io/npm/v/@pluv/io).

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
import { createClient, y } from "@pluv/client";
import { z } from "zod";
// Import the PluvIO instance as a type from your server file
import { type io } from "./server";

const client = createClient<typeof io>({ /* client config here */ });

type Presence = {};

interface Storage {
    groceryList: { [food: string]: number };
    messages: readonly { name: string; message: string }[]
}

// Create a room to join
const room = client.createRoom<Presence, Storage>("my-room", {
    initialStorage: () => ({
        groceryList: y.map([
            ["apricots", 2],
            ["bread", 3],
            ["cheese", 5],
        ]),
        messages: y.array([]),
    }),
    presence: z.object({}),
});
```

## Reference

Check us out on [GitHub](https://github.com/pluv-io/pluv) for more information on how to use `@pluv/io`.

