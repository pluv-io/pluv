## pluv

CLI for [pluv.io](https://pluv.io).

## Installation

pluv targets TypeScript projects. The server entry is a `.ts`, `.tsx`, `.mts`, or `.cts` module, and the project needs a `tsconfig.json`. Install `typescript` next to `pluv`.

```bash
# npm
npm install pluv
npm install --save-dev typescript

# yarn
yarn add pluv
yarn add --dev typescript

# pnpm
pnpm add pluv
pnpm add -D typescript
```

You can import `.js` modules from that TypeScript entry. A `.js` path used as the entry itself is rejected. `pluv.config.js` is still a valid config file.

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

Each command loads `.env` and `.env.local` from the project root before anything else runs. A variable already set in the shell is kept; `.env.local` overrides `.env` for the same key. That is how you set `PLUV_API_TOKEN` or `PLUV_SESSION_TOKEN` for hosted commands without exporting them in the shell.

For `pluv dev`, only the `env` map in config is copied onto the room's `process.env`, so the room can reach a database without seeing the rest of the shell. Keys starting with `PLUV_` in that map are reserved. Issue room tokens from your own app. Point the client `authEndpoint` at that route.

For CI deploys, create an account API token in the pluv dashboard (your organization’s **Settings → API tokens**) with policies that grant the org or project access you need (for example **Deployments**), then set the secret as `PLUV_API_TOKEN` in `.env.local` (gitignored) or in your CI secrets. The token belongs to your user account; org access comes from those policies, not from the organization owning the token.

A path argument and flags override the file: `pluv dev ./src/io.ts --port 8787`. `pluv dev --help` lists them.

`pluv dev` does not typecheck. Run `pluv build` to check the entry.

Saving the server module reloads the room code. The room facet keeps its storage. Connected clients reconnect.

## `pluv build`

Typechecks the server entry, then bundles it for upload. The hosted platform runs its own supervisor and facet, and loads this file as `server.js`.

```bash
pluv build
```

The check uses the project's `typescript` and the nearest `tsconfig.json`. It does not change that file. When it finishes, the log shows how long typechecking and bundling took.

Skip the check for one run with `pluv build --no-typecheck`. Or skip it from config. That only skips type errors. The entry still has to be TypeScript.

```ts
export default defineConfig({
    entry: "./src/io.ts",
    typescript: {
        ignoreBuildErrors: true,
    },
});
```

The artifact is `.pluv/build/server.js`. A path argument overrides the config entry: `pluv build ./src/io.ts`. The room's `env` is supplied by the platform, so this bundle does not copy `process.env`.

A hosted entry that only imports `@pluv/platform` does not need `@cloudflare/workers-types`. Add those types when the entry names Worker APIs such as `DurableObject` or `D1Database`. If typecheck and the bundle resolve different conditional exports, set `compilerOptions.customConditions` to `["workerd", "worker", "import"]` so they follow the same conditions the bundler uses.
