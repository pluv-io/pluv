import { z } from "zod";
import { ZodWhoamiAccount } from "./ZodWhoamiAccount";

export const ZodWhoami = z.object({
    user: ZodWhoamiAccount.nullable(),
});

export type WhoamiResponse = z.infer<typeof ZodWhoami>;
