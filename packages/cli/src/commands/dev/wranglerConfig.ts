import { COMPATIBILITY_DATE } from "../../constants";

export const wranglerConfig = (): string => {
    return JSON.stringify(
        {
            name: "pluv-dev",
            main: "worker.mjs",
            compatibility_date: COMPATIBILITY_DATE,
            durable_objects: {
                bindings: [{ name: "rooms", class_name: "RoomSupervisor" }],
            },
            migrations: [{ tag: "v1", new_sqlite_classes: ["RoomSupervisor"] }],
            worker_loaders: [{ binding: "LOADER" }],
        },
        null,
        4,
    );
};
