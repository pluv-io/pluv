import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

const databasePath = resolve(dirname(fileURLToPath(import.meta.url)), "../../dev.db");
const sqlite = new Database(databasePath);

export const db = drizzle(sqlite, { schema });
