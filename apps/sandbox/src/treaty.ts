import { s } from "@pluv/crdt";
import { yjs } from "@pluv/crdt-yjs";
import { createTreaty } from "@pluv/treaty";
import { z } from "zod";

const t = createTreaty({
    user: z.object({
        id: z.string(),
        name: z.string(),
    }),
    presence: z.object({
        count: z.number(),
    }),
    storage: yjs.schema({
        messages: yjs.yArray(yjs.yMap(s.string())),
    }),
});

const increment = t.procedure.presence.resolve((_input, { presence }) => ({
    count: presence.count + 1,
}));

const addMessage = t.procedure.storage
    .input(z.object({ message: z.string(), name: z.string() }))
    .resolve(({ message, name }, { storage }) => {
        storage.messages.push([
            yjs.map([
                ["message", message],
                ["name", name],
            ]),
        ]);
    });

export const treaty = t.router({ addMessage, increment });
