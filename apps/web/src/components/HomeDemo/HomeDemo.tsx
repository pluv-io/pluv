"use client";

import { DataTable, Separator } from "@pluv-internal/react-components/client";
import { Anchor, Card } from "@pluv-internal/react-components/either";
import { cn } from "@pluv-internal/utils";
import type { Table as ReactTable } from "@tanstack/react-table";
import type { FC } from "react";
import { useState } from "react";
import { useStorage } from "../../pluv-io/cloudflare";
import { HomeDemoColumns } from "./HomeDemoColumns";
import { HomeDemoOthers } from "./HomeDemoOthers";
import { HomeDemoToolbar } from "./HomeDemoToolbar";
import { HomeDemoUserNav } from "./HomeDemoUserNav";
import type { Task } from "./schema";

export interface HomeDemoProps {
    className?: string;
}

export const HomeDemo: FC<HomeDemoProps> = ({ className }) => {
    const [tasks] = useStorage("demoTasks");
    const [table, tableRef] = useState<ReactTable<Task> | null>(null);

    return (
        <Card className={cn("shadow-md", className)}>
            <Card.Header className="flex flex-col items-center justify-between gap-4 space-y-2 md:flex-row">
                <div className="flex flex-col items-start self-start md:self-center">
                    <Card.Title className="text-2xl">Welcome back!</Card.Title>
                    <Card.Description className="text-base">
                        Experiences like these should be collaborative. Click around!
                    </Card.Description>
                </div>
                <div className="flex items-center space-x-2 self-end md:self-center">
                    <HomeDemoOthers />
                    <Separator className="h-7" orientation="vertical" />
                    <HomeDemoUserNav />
                </div>
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
                Table adapted from{" "}
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
