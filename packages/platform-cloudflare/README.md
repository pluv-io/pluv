> **Disclaimer:**
> This package is currently in preview and may have breaking changes between versions. Please wait for a `v1.0.0` stable release before using this in production.

<h1 align="center">
  <br />
  <img src="https://github.com/pluv-io/pluv/blob/master/assets/pluv-icon-192x192.png?raw=true" alt="Pluv.IO" width="180" style="border-radius:16px" />
  <br />
  Pluv.IO (preview)
  <br />
</h1>

<h3 align="center">Multi-platform, E2E type-safe realtime packages</h3>
<h4 align="center">💕 Inspired by <a href="https://trpc.io">trpc</a> 💕 Built with <a href="https://docs.yjs.dev/">yjs</a> 💕</h4>

<p align="center">
  <a href="https://www.npmjs.com/package/@pluv/platform-cloudflare">
    <img src="https://img.shields.io/npm/v/@pluv/platform-cloudflare" alt="npm @pluv/platform-cloudflare" />
  </a>
  <a href="https://github.com/pluv-io/pluv/blob/master/LICENSE">
    <img alt="GitHub" src="https://img.shields.io/github/license/pluv-io/pluv" alt="License MIT" />
  </a>
  <img src="https://badgen.net/badge/-/TypeScript?icon=typescript&label&labelColor=blue&color=555555" alt="TypeScript" />
  <a href="https://commitizen.github.io/cz-cli/">
    <img src="https://img.shields.io/badge/commitizen-friendly-brightgreen.svg" alt="Commitizen friendly" />
  </a>
  <img src="https://img.shields.io/badge/docs-coming%20soon!-blue" alt="Docs coming soon!" />
</p>

<p align="center">
  <img src="https://github.com/pluv-io/pluv/blob/master/assets/demo-events.gif?raw=true" alt="Demo" />
</p>

## `@pluv/platform-cloudflare`

> Enables [@pluv/io](https://www.npmjs.com/package/@pluv/io) to run on [Cloudflare Workers](https://workers.cloudflare.com/).

## Installation

```bash
# npm
npm install @pluv/platform-cloudflare

# yarn
yarn add @pluv/platform-cloudflare

# pnpm
pnpm add @pluv/platform-cloudflare
```

## Basic Example

```ts
import { createIO } from "@pluv/io";
import { platformCloudflare } from "@pluv/platform-cloudflare";

export const io = createIO({
    platform: platformCloudflare(),
});

/* Somewhere in a Cloudflare worker durable object */
const { 0: client, 1: server } = new WebSocketPair();

await io.register(server);

return new Response(null, { status: 101, webSocket: client });
```

## Reference

Check us out on [GitHub](https://github.com/pluv-io/pluv) for more information on how to use `@pluv/io`.
