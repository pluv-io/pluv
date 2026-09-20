import { s } from "@pluv/crdt";
import { yjs } from "@pluv/crdt-yjs";
import { createTreaty } from "@pluv/treaty";
import { z } from "zod";

export const treaty = createTreaty({
    user: z.object({
        id: z.string(),
        name: z.string(),
    }),
    presence: z.object({
        blocknote: z.any().default({}),
        count: z.number(),
    }),
    storage: yjs.schema({
        blocknote: yjs.yXmlFragment(),
        messages: yjs.yArray(yjs.yMap(s.string())),
        slate: yjs.yXmlText(),
    }),
});
