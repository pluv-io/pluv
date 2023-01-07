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
  <a href="https://www.npmjs.com/package/@pluv/persistance-redis">
    <img src="https://img.shields.io/npm/v/@pluv/persistance-redis" alt="npm @pluv/persistance-redis" />
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

<img src="https://github.com/pluv-io/pluv/blob/master/assets/demo-events.gif?raw=true" alt="Demo" />

## `@pluv/persistance-redis`

> Yjs storage persistance for [@pluv/io](https://img.shields.io/npm/v/@pluv/io) rooms on distributed systems. Available for [Node.js](https://nodejs.org/) only.

## Installation

```bash
# npm
npm install @pluv/persistance-redis ioredis

# yarn
yarn add @pluv/persistance-redis ioredis

# pnpm
pnpm add @pluv/persistance-redis ioredis
```

## Basic Example

```ts
import { createIO } from "@pluv/io";
import { PersistanceRedis } from "@pluv/persistance-redis";
import { PubSubRedis } from "@pluv/pubsub-redis";
import { platformNode } from "@pluv/platform-node";
import { Redis } from "ioredis";

const redis = new Redis({ /* redis config here */ });

export const io = createIO({
    platform: platformNode({
        persistance: new PersistanceRedis({ client: cluster }),
        pubSub: new PubSubRedis({
            publisher: cluster,
            subscriber: cluster,
        }),
    }),
});
```

## Reference

Check us out on [GitHub](https://github.com/pluv-io/pluv) for more information on how to use `@pluv/io`.
