## pluv

CLI for [pluv.io](https://pluv.io).

## Installation

```bash
# npm
npm install pluv

# yarn
yarn add pluv

# pnpm
pnpm add pluv
```

## `pluv dev`

Serves room websockets for a `@pluv/platform` server on your machine. Add `pluv.config.ts` next to the command:

```ts
import { defineConfig } from "pluv";

export default defineConfig({
    entry: "./src/io.ts",
});
```

`entry` is the module whose default export is the `io.server()` result. Without a config file, `pluv dev` uses `./pluv.ts` and port `8787`, and prints a warning. Run:

```bash
pluv dev
```

Point the client at `ws://localhost:8787/api/pluv/room/${room}`.

```ts
export default defineConfig({
    entry: "./src/io.ts",
    port: 8787,
    env: {
        DATABASE_URL: process.env.DATABASE_URL,
    },
});
```

`.env` is loaded into the `pluv dev` process before the config runs. A variable already set in the shell is kept. `env` is the only map copied onto the room's `process.env`, so the room can reach a database without seeing the rest of the shell. Keys starting with `PLUV_` are reserved. Issue room tokens from your own app. Point the client `authEndpoint` at that route.

A path argument and flags override the file: `pluv dev ./src/io.ts --port 8787`. `pluv dev --help` lists them.

Saving the server module reloads the room code. The room facet keeps its storage. Connected clients reconnect.

## `pluv build`

Bundles the io server module for upload. The hosted platform runs its own supervisor and facet, and loads this file as `server.js`.

```bash
pluv build
```

The artifact is `.pluv/build/server.js`. A path argument overrides the config entry: `pluv build ./src/io.ts`. The room's `env` is supplied by the platform, so this bundle does not copy `process.env`.
