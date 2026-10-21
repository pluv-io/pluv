---
"@pluv/treaty": minor
"@pluv/io": minor
"@pluv/types": minor
---

The session manager can return the treaty's user, presence, storage, and procedure input schemas as one JSON document.

```ts
const sessions = manageSessions(io.server().createRoom(roomId));

const schema = sessions.getTreatySchema();
```

`getTreatySchema()` returns one document. Presence and storage each carry their schema and their procedures together. A treaty with only a user has `presence: null` and `storage: null`.

Take a treaty like this:

```ts
const t = createTreaty({
    user: z.object({ id: z.string(), name: z.string() }),
    presence: z.object({ selectionId: z.string().nullable() }),
    storage: yjs.schema({ messages: yjs.yArray(s.string()) }),
});

const select = t.procedure.presence
    .input(z.object({ id: z.string().nullable() }))
    .resolve(({ id }) => ({ selectionId: id }));
const touch = t.procedure.presence.resolve(() => ({ selectionId: null }));
const addMessage = t.procedure.storage
    .input(z.object({ text: z.string() }))
    .resolve(({ text }, { storage }) => {
        storage.messages.push([text]);
    });

export const treaty = t.router({ select, touch, addMessage });
```

`sessions.getTreatySchema()` then returns:

```ts
{
  user: {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    type: "object",
    properties: {
      id: { type: "string" },
      name: { type: "string" },
    },
    required: ["id", "name"],
    additionalProperties: false,
  },
  presence: {
    schema: {
      $schema: "https://json-schema.org/draft/2020-12/schema",
      type: "object",
      properties: {
        selectionId: { type: ["string", "null"] },
      },
      required: ["selectionId"],
      additionalProperties: false,
    },
    procedures: {
      select: {
        input: {
          $schema: "https://json-schema.org/draft/2020-12/schema",
          type: "object",
          properties: {
            id: { type: ["string", "null"] },
          },
          required: ["id"],
        },
      },
      // This procedure has no `.input()`.
      touch: { input: null },
    },
  },
  storage: {
    schema: {
      kind: "y.doc",
      shape: {
        messages: { kind: "yArray", item: { kind: "string" } },
      },
    },
    procedures: {
      addMessage: {
        input: {
          $schema: "https://json-schema.org/draft/2020-12/schema",
          type: "object",
          properties: {
            text: { type: "string" },
          },
          required: ["text"],
        },
      },
    },
  },
}
```

`user` and `presence.schema` are the output JSON Schema. Procedure `input` values are the input JSON Schema. `storage.schema` is the CRDT schema tree (`kind` and `shape`).

The same pieces are available on the treaty:

```ts
treaty.toUserJson();
treaty.toPresenceJson();
treaty.toStorageJson();
treaty.toProceduresJson();
```
