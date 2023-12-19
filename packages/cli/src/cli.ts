#!/usr/bin/env node
import Pastel from "pastel";
import type { z } from "zod";
import type { ZodPluvConfig } from "./schemas/index.js";

export type PluvConfig = z.input<typeof ZodPluvConfig>;

const app = new Pastel({
    importMeta: import.meta,
});

await app.run();
