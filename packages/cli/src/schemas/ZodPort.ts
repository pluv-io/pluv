import { z } from "zod";

export const DEFAULT_PORT = 8787;

const portError = { error: "port must be an integer from 1 to 65535." } as const;

export const ZodPort = z.number(portError).int(portError).min(1, portError).max(65535, portError);
