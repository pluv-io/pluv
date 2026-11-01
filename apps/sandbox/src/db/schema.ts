import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
});

export const rooms = sqliteTable("rooms", {
    name: text("name").primaryKey(),
    storage: text("storage"),
});
