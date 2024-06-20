"use client";

import { DataTable } from "@pluv-internal/react-components/client";
import { Anchor, Card } from "@pluv-internal/react-components/either";
import { cn } from "@pluv-internal/utils";
import type { Table as ReactTable } from "@tanstack/react-table";
import type { FC } from "react";
import { useState } from "react";
import { HomeDemoColumns } from "./HomeDemoColumns";
import { HomeDemoToolbar } from "./HomeDemoToolbar";
import type { Task } from "./schema";
import { useStorage } from "../../pluv-io/cloudflare";

export interface HomeDemoProps {
    className?: string;
}

export const HomeDemo: FC<HomeDemoProps> = ({ className }) => {
    const [tasks] = useStorage("demoTasks");
    const [table, tableRef] = useState<ReactTable<Task> | null>(null);

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
                <DataTable<Task>
                    ref={tableRef}
                    className="my-4 min-w-0"
                    columns={HomeDemoColumns}
                    data={(tasks ?? []) as Task[]}
                />
                <DataTable.Pagination table={table} />
            </Card.Content>
            <Card.Footer className="justify-end whitespace-pre text-right text-xs text-muted-foreground">
                Table taken from{" "}
                <Anchor
                    className="text-inherit"
                    href="https://ui.shadcn.com/examples/tasks"
                    target="_blank"
                    rel="noreferrer noopener"
                >
                    shadcn/ui
                </Anchor>
            </Card.Footer>
        </Card>
    );
};
