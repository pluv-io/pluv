# @pluv/platform

## 6.0.0

### Major Changes

- 16bfe64: Remove `@pluv/platform-pluv` and client event routers. Run the room with `@pluv/platform-node` or `@pluv/platform-cloudflare`. Define events on the server with `io.procedure` and `io.router`. Pass `secret` on `.config()`, and pass `authEndpoint` and `wsEndpoint` on the client.

### Minor Changes

- 5fd5092: Add `@pluv/platform`. Pass `platformPluv()` to `createIO().platform()`.

    ```ts
    import { createIO } from "@pluv/io";
    import { platformPluv } from "@pluv/platform";

    const io = createIO().platform(platformPluv());
    ```

- 8cde8bd: A treaty procedure can carry a description, and a host can read the room back after a call.

    ```ts
    const select = t.procedure.presence
        .describe("Set the caller's selection")
        .input(z.object({ id: z.string().nullable() }))
        .resolve(({ id }) => ({ selectionId: id }));

    const addMessage = t.procedure.storage
        .describe("Append a message to the room")
        .input(z.object({ text: z.string() }))
        .resolve(({ text }, { storage }) => {
            storage.messages.push([text]);
        });
    ```

    `getTreatySchema()` returns that text as `description` beside `input`. A procedure without `.describe()` has `description: null`.

    ```ts
    const sessions = manageSessions(io.server().createRoom(roomId));

    const presence = await sessions.__experimental_presence({ senderId }).select({ id: "item-1" });
    // { selectionId: "item-1" }

    const document = await sessions.getStorageJson();
    // { messages: ["hello"] }
    ```

### Patch Changes

- 38bd287: A host presence call waits for a procedure that is still running.

    The call returns that connection's presence once the update is stored.

- Updated dependencies [4058575]
- Updated dependencies [b5d7caf]
- Updated dependencies [048d337]
- Updated dependencies [d55f1f7]
- Updated dependencies [a521c50]
- Updated dependencies [ba6805a]
- Updated dependencies [0ee9d2d]
- Updated dependencies [16bfe64]
- Updated dependencies [d10f401]
- Updated dependencies [4058575]
- Updated dependencies [37316c7]
- Updated dependencies [ba18fd7]
- Updated dependencies [d46b156]
- Updated dependencies [f978762]
- Updated dependencies [4058575]
- Updated dependencies [38bd287]
- Updated dependencies [67ab7f2]
- Updated dependencies [7d858b0]
- Updated dependencies [b7a9042]
- Updated dependencies [8ca1791]
- Updated dependencies [80a5c16]
- Updated dependencies [8fa4d45]
- Updated dependencies [392a989]
- Updated dependencies [ba4ab54]
- Updated dependencies [5cac309]
- Updated dependencies [1f6f749]
- Updated dependencies [b506710]
- Updated dependencies [8cde8bd]
- Updated dependencies [ad09444]
- Updated dependencies [861da09]
    - @pluv/types@6.0.0
    - @pluv/io@6.0.0
    - @pluv/persistence-cloudflare-transactional-storage@6.0.0
