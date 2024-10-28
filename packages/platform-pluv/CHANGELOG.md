# @pluv/platform-pluv

## 0.32.7

### Patch Changes

- a9a1f7b: Export event schemas.
  - @pluv/crdt@0.32.7
  - @pluv/io@0.32.7
  - @pluv/types@0.32.7

## 0.32.6

### Patch Changes

- 25292d4: Fix event payload types to only contain serializable fields.
- c0956e7: Add `onUserConnected` and `onUserDisconnected` events on `PluvServer`.

  ```ts
  import { createIO } from "@pluv/io";

  const io = createIO({
    /* ... */
  });

  const ioServer = io.server({
    // ...
    onUserConnected: (event) => {
      // ...
    },
    onUserDisconnected: (event) => {
      // ...
    },
  });
  ```

- fc83a44: Enable `onUserConnected` and `onUserDisconnected` event listeners.
- be1488f: Validate webhook signatures via webhook secrets.

  ```ts
  import { createIO } from "@pluv/platform-pluv";

  const io = createIO({
    // ...
    // If you provide a webhookSecret
    webhookSecret: "whsec_...",

    // The following properties will be made available to configure
    getInitialStorage: (event) => {
      /* ... */
    },
    onRoomDeleted: (event) => {
      /* ... */
    },
    onUserConnected: (event) => {
      /* ... */
    },
    onUserDisconnected: (event) => {
      /* ... */
    },
  });
  ```

- Updated dependencies [c0956e7]
  - @pluv/io@0.32.6
  - @pluv/crdt@0.32.6
  - @pluv/types@0.32.6

## 0.32.5

### Patch Changes

- @pluv/crdt@0.32.5
- @pluv/io@0.32.5
- @pluv/types@0.32.5

## 0.32.4

### Patch Changes

- @pluv/crdt@0.32.4
- @pluv/io@0.32.4
- @pluv/types@0.32.4

## 0.32.3

### Patch Changes

- cce989d: Added properties for internal use only.
- 5a3114f: Fixed thrown error when calling `createToken`.
- Updated dependencies [bb21274]
  - @pluv/io@0.32.3
  - @pluv/crdt@0.32.3
  - @pluv/types@0.32.3

## 0.32.2

### Patch Changes

- Updated dependencies [890d45b]
  - @pluv/io@0.32.2
  - @pluv/crdt@0.32.2
  - @pluv/types@0.32.2

## 0.32.1

### Patch Changes

- 7ae3df3: Update endpoint to generate authorization tokens.
  - @pluv/crdt@0.32.1
  - @pluv/io@0.32.1
  - @pluv/types@0.32.1

## 0.32.0

### Patch Changes

- Updated dependencies [cde5305]
  - @pluv/io@0.32.0
  - @pluv/crdt@0.32.0
  - @pluv/types@0.32.0

## 0.31.0

### Minor Changes

- b3c31d7: **BREAKING**

  Fixed platform context types. This will require additional properties when registering a websocket and creating authorization tokens. See example below:

  ```ts
  // @pluv/platform-node example

  import { platformNode } from "@pluv/platform-node";
  import { createIO } from "@pluv/io";
  import type { IncomingMessage } from "node:http";
  import { z } from "zod";

  const io = createIO({
      // If using a function authorize parameter, `req` is now available as a param
      authorize: ({ req }) => ({
          required: true,
          secret: "MY-CUSTOM-SECRET",
          user: z.object({
              id: z.string(),
          }),
      }),
      platformNode(),
  });

  // Before
  io.createToken({
      room: "my-custom-room",
      user: { id: "abc123" },
  });

  // After
  io.createToken({
      room: "my-custom-room",
      user: { id: "abc123" },

      // Previously not required, but now required
      req: req as IncomingMessage,
  });
  ```

  ```ts
  // @pluv/platform-cloudflare example

  import { platformCloudflare } from "@pluv/platform-cloudflare";
  import { createIO } from "@pluv/io";
  import { z } from "zod";

  const io = createIO({
      // If using a function authorize parameter, `env` and `request` are now available as params
      authorize: ({ env, request }) => ({
          required: true,
          secret: "MY-CUSTOM-SECRET",
          user: z.object({
              id: z.string(),
          }),
      }),
      platformCloudflare(),
  });

  // Before
  io.createToken({
      room: "my-custom-room",
      user: { id: "abc123" },
  });

  // After
  io.createToken({
      room: "my-custom-room",
      user: { id: "abc123" },

      // Previously not required, but now required
      env: env as Env,
      request: request as Request,
  });
  ```

### Patch Changes

- Updated dependencies [b3c31d7]
  - @pluv/io@0.31.0
  - @pluv/crdt@0.31.0
  - @pluv/types@0.31.0

## 0.30.2

### Patch Changes

- @pluv/crdt@0.30.2
- @pluv/io@0.30.2
- @pluv/types@0.30.2

## 0.30.1

### Patch Changes

- 47784d5: Add missing `publicKey` param to `createIO`.
- Updated dependencies [b9c3633]
  - @pluv/io@0.30.1
  - @pluv/crdt@0.30.1
  - @pluv/types@0.30.1

## 0.30.0

### Minor Changes

- fa496a2: Add new package `@pluv/platform-pluv`.

### Patch Changes

- Updated dependencies [7246a9e]
  - @pluv/io@0.30.0
  - @pluv/crdt@0.30.0
  - @pluv/types@0.30.0
