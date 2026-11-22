import { z } from "zod";
import { isTypeScriptEntry, typescriptEntryMessage } from "../lib/typescriptEntry";

export const DEFAULT_ENTRY = "./pluv.ts";

export const ZodEntry = z
    .string({ error: "entry must be a module path." })
    .min(1, { error: "entry must be a module path." })
    .superRefine((entry, ctx) => {
        if (isTypeScriptEntry(entry)) return;

        ctx.addIssue({
            code: "custom",
            message: typescriptEntryMessage(process.cwd(), entry),
        });
    });
