# @pluv/types

## 0.17.2

## 0.17.1

## 0.17.0

### Minor Changes

- 507bc00: _BREAKING_: The `authorize` config when calling `createIO` can now also be a function that exposes the platform context.
  This allows accessing the `env` in Cloudflare workers.

  ```ts
  import { createIO } from "@pluv/io";
  import { platformCloudflare } from "@pluv/platform-cloudflare";
  import { z } from "zod";

  const io = createIO({
    authorize: ({ env }) => ({
      required: true,
      secret: env.PLUV_AUTHORIZE_SECRET,
      user: z.object({
        id: z.string(),
        name: z.string(),
      }),
    }),
    platform: platformCloudflare<{ PLUV_AUTHORIZE_SECRET: string }>(),
    // ...
  });
  ```

  This also requires that the platform contexts are passed to `io.createToken`.

  ```ts
  // If using `platformNode`
  await io.createToken({
    req, // This `IncomingMessage` is now required
    room,
    user: {
      id: "user_123",
      name: "john doe",
    },
  });

  // If using `platformCloudflare`
  await io.createToken({
    env, // This env is now required from the handler's fetch function
    room,
    user: {
      id: "user_123",
      name: "john doe",
    },
  });
  ```

## 0.16.3

## 0.16.2

## 0.16.1

## 0.16.0

## 0.15.0

## 0.14.1

## 0.14.0

## 0.13.0

## 0.12.3

## 0.12.2

### Patch Changes

- 259a7da: Bumped dependencies

## 0.12.1

## 0.12.0

## 0.11.1

## 0.11.0

## 0.10.3

## 0.10.2

## 0.10.1

### Patch Changes

- 885835d: remove unnecessary dependency

## 0.10.0

### Minor Changes

- f43f1cc: Change packages to all be versioned together for consistency.

## 0.2.2

### Patch Changes

- 8fba48b: fix including incorrect dependency
- 8997c65: bumped dependencies

## 0.2.1

### Patch Changes

- 8d11672: bumped dependencies to latest

## 0.2.0

### Minor Changes

- bb2886b: allow sending multiple output types (broadcast, self, sync) per event
- ae679a8: updated offline presence to be set when reconnecting to a room

### Patch Changes

- 0dd847e: updated storage to be synced when reconnected to the room

## 0.1.6

### Patch Changes

- 850626e: bumped dependencies

## 0.1.5

### Patch Changes

- 74870ee: bumped dependencies

## 0.1.4

### Patch Changes

- 9516a4e: updated typescript to 5.0
- 7b6da1c: bumped dependencies
- e9c1514: bumped dependencies

## 0.1.3

### Patch Changes

- 8bf62cb: bumped dependencies
- 7e52685: Bumped dependencies
- 8e97fb2: Updated dependencies

## 0.1.2

### Patch Changes

- fe80d7b: added preview disclaimer about breaking changes in the readme

## 0.1.1

### Patch Changes

- 24016e6: Updated dependencies

## 0.1.0

### Minor Changes

- a22f525: Added documentation
