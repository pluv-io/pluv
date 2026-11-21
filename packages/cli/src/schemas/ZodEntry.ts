import { z } from "zod";

export const DEFAULT_ENTRY = "./pluv.ts";

export const ZodEntry = z
    .string({ error: "entry must be a module path." })
    .min(1, { error: "entry must be a module path." });
