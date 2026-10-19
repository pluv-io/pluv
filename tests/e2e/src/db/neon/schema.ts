import { pgTable, serial, text } from "drizzle-orm/pg-core";

export const rooms = pgTable("Room", {
    id: serial("id").primaryKey(),
    name: text("name").notNull().unique(),
    storage: text("storage"),
});
