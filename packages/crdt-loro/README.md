## `@pluv/crdt-loro`

> This package is currently in preview and may have breaking changes between versions.

> Loro adapter for [@pluv/client](https://www.npmjs.com/package/@pluv/client) and [@pluv/io](https://www.npmjs.com/package/@pluv/io).

**👉 See full documentation on [pluv.io](https://pluv.io/docs/introduction). 👈**

## Installation

```bash
# npm
npm install @pluv/crdt-loro loro-crdt

# yarn
yarn add @pluv/crdt-loro loro-crdt

# pnpm
pnpm add @pluv/crdt-loro loro-crdt
```

## Runtime resolution

Import `@pluv/crdt-loro` normally. Conditional exports pick the Loro entry best suited for each runtime:

| Runtime | Resolved build | Loro entry |
| --- | --- | --- |
| Browser (Vite, Webpack, etc.) | `dist/browser.mjs` | `loro-crdt` |
| Cloudflare Workers (Wrangler) | `dist/bundler.mjs` | `loro-crdt/bundler` |
| Bun | `dist/bundler.mjs` | `loro-crdt/bundler` |
| Node.js | `dist/node.mjs` | `loro-crdt/nodejs` |
| Deno | `dist/node.mjs` | `loro-crdt/nodejs` |
| Other bundlers (default) | `dist/bundler.mjs` | `loro-crdt/bundler` |

If your toolchain does not pick the expected build, import explicitly:

```ts
import { loro } from "@pluv/crdt-loro/browser";
import { loro } from "@pluv/crdt-loro/workerd";
import { loro } from "@pluv/crdt-loro/bun";
import { loro } from "@pluv/crdt-loro/node";
import { loro } from "@pluv/crdt-loro/deno";
```

## Browser setup

When using Loro in the browser (e.g. with Next.js or Vite), configure your bundler to handle WASM. See the [Loro getting started guide](https://loro.dev/docs/tutorial/get_started).

For Next.js with webpack, enable `asyncWebAssembly` in `next.config.js`:

```js
webpack: (config) => {
    config.experiments = { asyncWebAssembly: true };
    return config;
},
```

## Node.js, Deno, and Bun

When running on Node.js (e.g. with `@pluv/platform-node`), import `@pluv/crdt-loro` normally. Deno resolves to the same Node build. Bun resolves to the bundler build, which includes Bun-specific WASM initialization in `loro-crdt`.

## Cloudflare Workers

Import `@pluv/crdt-loro` normally in Workers. Wrangler resolves the `workerd` condition to the bundler build automatically. No wrangler alias is required.
