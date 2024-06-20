"use client";

import { DataTable } from "@pluv-internal/react-components/client";
import { Card } from "@pluv-internal/react-components/either";
import { cn } from "@pluv-internal/utils";
import type { Table as ReactTable } from "@tanstack/react-table";
import type { FC } from "react";
import { useState } from "react";
import { HomeDemoColumns } from "./HomeDemoColumns";
import { HomeDemoToolbar } from "./HomeDemoToolbar";
import tasks from "./generated/tasks.json";
import type { Task } from "./schema";

export interface HomeDemoProps {
    className?: string;
}

export const HomeDemo: FC<HomeDemoProps> = ({ className }) => {
    const [table, tableRef] = useState<ReactTable<Task> | null>(null);

    console.log(table);

    return (
        <Card className={cn("shadow-md", className)}>
            <Card.Header>
                <Card.Title className="text-2xl">Welcome back!</Card.Title>
                <Card.Description className="text-base">
                    Experiences like these should be collaborative. Click around!
                </Card.Description>
            </Card.Header>
            <Card.Content>
                <HomeDemoToolbar table={table} />
                <DataTable ref={tableRef} className="my-4" columns={HomeDemoColumns} data={tasks as Task[]} />
                <DataTable.Pagination table={table} />
            </Card.Content>
        </Card>
    );
};
