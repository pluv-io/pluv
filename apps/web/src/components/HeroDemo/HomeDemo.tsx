"use client";

import { DataTable } from "@pluv-internal/react-components/client";
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

    return (
        <div className={className}>
            <HomeDemoToolbar table={table} />
            <DataTable ref={tableRef} columns={HomeDemoColumns} data={tasks as Task[]} />
            <DataTable.Pagination table={table} />
        </div>
    );
};
