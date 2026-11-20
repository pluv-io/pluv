import { z } from "zod";

export const DEFAULT_DIST_DIR = ".pluv";

export const ZodDistDir = z
    .string({ error: "distDir must be a directory path." })
    .min(1, { error: "distDir must be a directory path." });
