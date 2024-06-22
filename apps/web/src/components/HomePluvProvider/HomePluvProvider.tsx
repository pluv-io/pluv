"use client";

import { yjs } from "@pluv/crdt-yjs";
import type { FC, ReactNode } from "react";
import tasks from "../../generated/tasks.json";
import { PluvRoomProvider } from "../../pluv-io/cloudflare";

export interface HomePluvProviderProps {
    children?: ReactNode;
}

export const HomePluvProvider: FC<HomePluvProviderProps> = ({ children }) => {
    return (
        <PluvRoomProvider
            debug={process.env.NODE_ENV === "development"}
            initialPresence={{
                selectionId: null,
            }}
            initialStorage={() => ({
                demoTasks: yjs.array(tasks.map((task) => yjs.object(task))),
            })}
            room="home-page"
        >
            {children}
        </PluvRoomProvider>
    );
};
