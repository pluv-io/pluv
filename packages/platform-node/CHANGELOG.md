# @pluv/platform-node

## 0.20.0

### Patch Changes

- @pluv/io@0.20.0
- @pluv/types@0.20.0

## 0.19.0

### Patch Changes

- @pluv/io@0.19.0
- @pluv/types@0.19.0

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

### Patch Changes

- Updated dependencies [428c21c]
- Updated dependencies [329dbcd]
- Updated dependencies [99b5ca9]
  - @pluv/io@0.18.0
  - @pluv/types@0.18.0

## 0.17.3

### Patch Changes

- @pluv/io@0.17.3
- @pluv/types@0.17.3

## 0.17.2

### Patch Changes

- @pluv/io@0.17.2
- @pluv/types@0.17.2

## 0.17.1

### Patch Changes

- @pluv/io@0.17.1
- @pluv/types@0.17.1

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

### Patch Changes

- Updated dependencies [507bc00]
  - @pluv/types@0.17.0
  - @pluv/io@0.17.0

## 0.16.3

### Patch Changes

- Updated dependencies [0bf0934]
  - @pluv/io@0.16.3
  - @pluv/types@0.16.3

## 0.16.2

### Patch Changes

- Updated dependencies [06f572d]
  - @pluv/io@0.16.2
  - @pluv/types@0.16.2

## 0.16.1

### Patch Changes

- Updated dependencies [cd05d96]
  - @pluv/io@0.16.1
  - @pluv/types@0.16.1

## 0.16.0

### Patch Changes

- Updated dependencies [4280220]
  - @pluv/io@0.16.0
  - @pluv/types@0.16.0

## 0.15.0

### Patch Changes

- @pluv/io@0.15.0
- @pluv/types@0.15.0

## 0.14.1

### Patch Changes

- @pluv/io@0.14.1
- @pluv/types@0.14.1

## 0.14.0

### Patch Changes

- @pluv/io@0.14.0
- @pluv/types@0.14.0

## 0.13.0

### Patch Changes

- @pluv/io@0.13.0
- @pluv/types@0.13.0

## 0.12.3

### Patch Changes

- da9f600: Upgraded dependencies
- Updated dependencies [da9f600]
  - @pluv/io@0.12.3
  - @pluv/types@0.12.3

## 0.12.2

### Patch Changes

- 259a7da: Bumped dependencies

## 0.12.1

### Patch Changes

- @pluv/io@0.12.1
- @pluv/types@0.12.1

## 0.12.0

### Patch Changes

- @pluv/io@0.12.0
- @pluv/types@0.12.0

## 0.11.1

### Patch Changes

- 74b3061: Bumped minor and patch dependencies.
- Updated dependencies [74b3061]
  - @pluv/io@0.11.1
  - @pluv/types@0.11.1

## 0.11.0

### Patch Changes

- Updated dependencies [b538f5c]
  - @pluv/io@0.11.0
  - @pluv/types@0.11.0

## 0.10.3

### Patch Changes

- Updated dependencies [a7d3ad1]
  - @pluv/io@0.10.3
  - @pluv/types@0.10.3

## 0.10.2

### Patch Changes

- Updated dependencies [3deee13]
  - @pluv/io@0.10.2
  - @pluv/types@0.10.2

## 0.10.1

### Patch Changes

- 0eeb67c: Passed through sessionId and userId into platform websockets.
- 885835d: remove unnecessary dependency
- Updated dependencies [0eeb67c]
- Updated dependencies [885835d]
  - @pluv/io@0.10.1
  - @pluv/types@0.10.1

## 0.10.0

### Minor Changes

- f43f1cc: Change packages to all be versioned together for consistency.

### Patch Changes

- Updated dependencies [f43f1cc]
  - @pluv/io@0.10.0
  - @pluv/types@0.10.0

## 0.3.4

### Patch Changes

- @pluv/io@0.7.2

## 0.3.3

### Patch Changes

- 8fba48b: fix including incorrect dependency
- 8997c65: bumped dependencies
- Updated dependencies [8fba48b]
- Updated dependencies [8997c65]
  - @pluv/types@0.2.2
  - @pluv/io@0.7.1

## 0.3.2

### Patch Changes

- 8d11672: bumped dependencies to latest
- Updated dependencies [8d11672]
- Updated dependencies [829d31b]
  - @pluv/types@0.2.1
  - @pluv/io@0.7.0

## 0.3.1

### Patch Changes

- Updated dependencies [2e7cbfa]
  - @pluv/io@0.6.0

## 0.3.0

### Minor Changes

- ae4e1f1: added platform-specific contexts to expose env in cloudflare and req in node.js

### Patch Changes

- Updated dependencies [ae4e1f1]
  - @pluv/io@0.5.0

## 0.2.1

### Patch Changes

- Updated dependencies [8917309]
  - @pluv/io@0.4.2

## 0.2.0

### Minor Changes

- 5bbfb98: added createPluvHandler to automatically set-up a pluv server with reasonable defaults

### Patch Changes

- 5bbfb98: require ws as a peer dependency
- b85a232: bumped dependencies
- Updated dependencies [b85a232]
  - @pluv/io@0.4.1
  - @pluv/types@0.2.0

## 0.1.18

### Patch Changes

- 41943cf: bumped dependencies
- 3518a83: bumped dependencies
- Updated dependencies [41943cf]
- Updated dependencies [0dd847e]
- Updated dependencies [bb2886b]
- Updated dependencies [ae679a8]
- Updated dependencies [3518a83]
  - @pluv/io@0.4.0
  - @pluv/types@0.2.0

## 0.1.17

### Patch Changes

- Updated dependencies [abb3622]
  - @pluv/io@0.3.9

## 0.1.16

### Patch Changes

- Updated dependencies [bcf1c3e]
  - @pluv/io@0.3.8

## 0.1.15

### Patch Changes

- Updated dependencies [ecc4040]
  - @pluv/io@0.3.7

## 0.1.14

### Patch Changes

- Updated dependencies [a7e2980]
  - @pluv/io@0.3.6

## 0.1.13

### Patch Changes

- 78fd644: updated readmes with links to the documentation website
- Updated dependencies [78fd644]
  - @pluv/io@0.3.5

## 0.1.12

### Patch Changes

- 850626e: bumped dependencies
- Updated dependencies [850626e]
  - @pluv/types@0.1.6
  - @pluv/io@0.3.4

## 0.1.11

### Patch Changes

- Updated dependencies [77069a1]
  - @pluv/io@0.3.3
  - @pluv/types@0.1.5

## 0.1.10

### Patch Changes

- Updated dependencies [9ae251d]
  - @pluv/io@0.3.2

## 0.1.9

### Patch Changes

- 74870ee: bumped dependencies
- Updated dependencies [74870ee]
  - @pluv/types@0.1.5
  - @pluv/io@0.3.1

## 0.1.8

### Patch Changes

- 57ae13f: bumped dependencies
- Updated dependencies [c5567f1]
- Updated dependencies [c5567f1]
  - @pluv/io@0.3.0
  - @pluv/types@0.1.4

## 0.1.7

### Patch Changes

- 9516a4e: updated typescript to 5.0
- 7b6da1c: bumped dependencies
- e9c1514: bumped dependencies
- 9d1829c: chore: bumped dependencies
- Updated dependencies [9516a4e]
- Updated dependencies [7b6da1c]
- Updated dependencies [e9c1514]
- Updated dependencies [9d1829c]
  - @pluv/types@0.1.4
  - @pluv/io@0.2.6

## 0.1.6

### Patch Changes

- 9c30e96: bumped dependencies
- 161e00e: fixed links to other pluv packages in readmes
- f6c0e65: bumped dependencies
- Updated dependencies [161e00e]
- Updated dependencies [f6c0e65]
  - @pluv/io@0.2.5
  - @pluv/types@0.1.3

## 0.1.5

### Patch Changes

- 8bf62cb: bumped dependencies
- 7e52685: Bumped dependencies
- b1cb325: Updated dependencies
- 8e97fb2: Updated dependencies
- Updated dependencies [8bf62cb]
- Updated dependencies [7e52685]
- Updated dependencies [3b7b17a]
- Updated dependencies [b1cb325]
- Updated dependencies [8e97fb2]
  - @pluv/io@0.2.4
  - @pluv/types@0.1.3

## 0.1.4

### Patch Changes

- Updated dependencies [95b5ef8]
- Updated dependencies [e23fbbe]
  - @pluv/io@0.2.3
  - @pluv/types@0.1.2

## 0.1.3

### Patch Changes

- fe80d7b: added preview disclaimer about breaking changes in the readme
- Updated dependencies [fe80d7b]
  - @pluv/io@0.2.2
  - @pluv/types@0.1.2

## 0.1.2

### Patch Changes

- Updated dependencies [b45d642]
- Updated dependencies [203dfee]
  - @pluv/io@0.2.1

## 0.1.1

### Patch Changes

- 24016e6: Updated dependencies
- Updated dependencies [23a7382]
- Updated dependencies [39271d4]
- Updated dependencies [24016e6]
  - @pluv/io@0.2.0
  - @pluv/types@0.1.1

## 0.1.0

### Minor Changes

- a22f525: Added documentation

### Patch Changes

- Updated dependencies [a22f525]
  - @pluv/io@0.1.0
  - @pluv/types@0.1.0
