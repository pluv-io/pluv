import { resolve } from "node:path";

export const devDir = (cwd: string): string => resolve(cwd, ".pluv/dev");
