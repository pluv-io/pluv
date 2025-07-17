# @pluv/types

## 3.2.2

### Patch Changes

- 8665dbe: Updated types of `createClient` so that the types inferred from `createClient` are flattened and no-longer depend on `@pluv/server`.

## 3.2.1

## 3.2.0

## 3.1.7

## 3.1.6

## 3.1.5

## 3.1.4

## 3.1.3

## 3.1.2

## 3.1.1

## 3.1.0

## 3.0.0

## 2.3.1

## 2.3.0

## 2.2.8

## 2.2.7

## 2.2.6

## 2.2.5

## 2.2.4

## 2.2.3

## 2.2.2

## 2.2.1

## 2.2.0

## 2.1.0

## 2.0.2

## 2.0.1

## 2.0.0

### Patch Changes

- 047a1d8: Moved several internal types to `@pluv/types`.

## 1.0.2

## 1.0.1

## 1.0.0

### Major Changes

- af94706: pluv.io is now stable and production ready!

    With this v1 release, pluv.io will now follow [semantic versioning](https://semver.org/) with more comprehensive release notes for future changes to the library.

    Checkout the [full documentation here](https://pluv.io/docs/introduction) to get started today!

## 0.44.2

## 0.44.1

## 0.44.0

## 0.43.0

## 0.42.0

## 0.41.7

## 0.41.6

## 0.41.5

## 0.41.4

## 0.41.3

## 0.41.2

## 0.41.1

## 0.41.0

## 0.40.2

## 0.40.1

## 0.40.0

## 0.39.1

## 0.39.0

## 0.38.14

## 0.38.13

## 0.38.12

## 0.38.11

## 0.38.10

## 0.38.9

## 0.38.8

## 0.38.7

## 0.38.6

## 0.38.5

## 0.38.4

## 0.38.3

## 0.38.2

## 0.38.1

## 0.38.0

### Minor Changes

- f4ceca3: Updated internal event names to follow a new naming convention.

## 0.37.7

## 0.37.6

## 0.37.5

## 0.37.4

## 0.37.3

## 0.37.2

## 0.37.1

## 0.37.0

## 0.36.0

## 0.35.4

## 0.35.3

## 0.35.2

### Patch Changes

- 81cb692: Fixed type inference of the `authorize` option in `createIO` when used as a function.

## 0.35.1

## 0.35.0

## 0.34.1

## 0.34.0

## 0.33.0

## 0.32.9

## 0.32.8

## 0.32.7

## 0.32.6

## 0.32.5

## 0.32.4

## 0.32.3

## 0.32.2

## 0.32.1

## 0.32.0

## 0.31.0

## 0.30.2

## 0.30.1

## 0.30.0

## 0.29.0

## 0.28.0

## 0.27.0

## 0.26.0

## 0.25.4

## 0.25.3

## 0.25.2

## 0.25.1

## 0.25.0

## 0.24.1

## 0.24.0

## 0.23.0

## 0.22.0

## 0.21.1

## 0.21.0

## 0.20.0

## 0.19.0

## 0.18.0

### Minor Changes

- 99b5ca9: ## Breaking Changes
    - `@pluv/io` has been updated to introduce `PluvProcedure`, `PluvRouter` and `PluvServer`. This change is intended to improve the ergonomics of declaring events and simplifying inferences of event types.

    ### Before:

    ```ts
    // backend/io.ts

    import { createIO } from "@pluv/io";
    import { createPluvHandler, platformNode } from "@pluv/platform-node";
    import { z } from "zod";

    export const io = createIO({
        platform: platformNode(),
    })
        .event("SEND_MESSAGE", {
            input: z.object({ message: z.string() }),
            resolver: ({ message }) => ({ RECEIVE_MESSAGE: { message } }),
        })
        .event("DOUBLE_VALUE", {
            input: z.object({ value: z.number() }),
            resolver: ({ value }) => ({ VALUE_DOUBLED: { value: value * 2 } }),
        });

    const Pluv = createPluvHandler({
        io,
        /* ... */
    });
    ```

    ```ts
    // frontend/pluv.ts

    import { createClient } from "@pluv/react";
    import type { io } from "../backend/io";

    const client = createClient<typeof io>({
        /* ... */
    });
    ```

    ### Now:

    ```ts
    import { createIO } from "@pluv/io";
    import { createPluvHandler, platformNode } from "@pluv/platform-node";
    import { z } from "zod";

    const io = createIO({
        platform: platformNode(),
    });

    const router = io.router({
        SEND_MESSAGE: io.procedure
            .input(z.object({ message: z.string() }))
            .broadcast(({ message }) => ({
                RECEIVE_MESSAGE: { message },
            })),
        DOUBLE_VALUE: io.procedure
            .input(z.object({ value: z.number() }))
            .broadcast(({ value }) => ({
                VALUE_DOUBLED: { value: value * 2 },
            })),
    });

    export const ioServer = io.server({ router });

    const Pluv = createPluvHandler({
        io: ioServer, // <- This uses the PluvServer now
        /* ... */
    });
    ```

    ```ts
    // frontend/pluv.ts

    import { createClient } from "@pluv/react";
    import type { ioServer } from "../backend/io";

    // This users the PluvServer type now
    const client = createClient<typeof ioServer>({
        /* ... */
    });
    ```

    - `PluvRouter` instances can also be merged via the `mergeRouters` method, which effectively performs an `Object.assign` of the events object and returns a new `PluvRouter` with the correct types:

    ```ts
    const router = io.mergeRouters(router1, router2);
    ```

## 0.17.3

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
