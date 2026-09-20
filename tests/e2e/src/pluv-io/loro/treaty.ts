import { s } from "@pluv/crdt";
import { loro } from "@pluv/crdt-loro";
import { createTreaty } from "@pluv/treaty";
import { z } from "zod";

export const treaty = createTreaty({
    user: z.object({
        id: z.string(),
        name: z.string(),
    }),
    presence: z.object({
        count: z.number(),
    }),
    storage: loro.schema({
        messages: loro.loroList(loro.loroMap(s.string())),
    }),
});
