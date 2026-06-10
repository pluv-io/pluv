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

## Browser setup

When using Loro in the browser (e.g. with Next.js or Vite), configure your bundler to handle WASM. See the [Loro getting started guide](https://loro.dev/docs/tutorial/get_started).

For Next.js with webpack, enable `asyncWebAssembly` in `next.config.js`:

```js
webpack: (config) => {
    config.experiments = { asyncWebAssembly: true };
    return config;
},
```

## Node.js

When running on Node.js (e.g. with `@pluv/platform-node`), import `@pluv/crdt-loro` normally. The package resolves to a Node build automatically via conditional exports.

If your toolchain does not pick the Node build, import explicitly:

```ts
import { loro } from "@pluv/crdt-loro/node";
```
