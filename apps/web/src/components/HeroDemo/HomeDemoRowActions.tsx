"use client";

import { DropdownMenu } from "@pluv-internal/react-components/client";
import { Button } from "@pluv-internal/react-components/either";
import { DotsHorizontalIcon } from "@pluv-internal/react-icons";
import type { Row } from "@tanstack/react-table";
import { labels } from "./data";
import { taskSchema } from "./schema";

interface DataTableRowActionsProps<TData> {
    row: Row<TData>;
}

export const HomeDemoRowActions = <TData extends unknown>({ row }: DataTableRowActionsProps<TData>) => {
    const task = taskSchema.parse(row.original);

    return (
        <DropdownMenu>
            <DropdownMenu.Trigger asChild>
                <Button variant="ghost" className="flex size-8 p-0 data-[state=open]:bg-muted">
                    <DotsHorizontalIcon className="size-4" />
                    <span className="sr-only">Open menu</span>
                </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="end" className="w-[160px]">
                <DropdownMenu.Item>Edit</DropdownMenu.Item>
                <DropdownMenu.Item>Make a copy</DropdownMenu.Item>
                <DropdownMenu.Item>Favorite</DropdownMenu.Item>
                <DropdownMenu.Separator />
                <DropdownMenu.Sub>
                    <DropdownMenu.SubTrigger>Labels</DropdownMenu.SubTrigger>
                    <DropdownMenu.SubContent>
                        <DropdownMenu.RadioGroup value={task.label}>
                            {labels.map((label) => (
                                <DropdownMenu.RadioItem key={label.value} value={label.value}>
                                    {label.label}
                                </DropdownMenu.RadioItem>
                            ))}
                        </DropdownMenu.RadioGroup>
                    </DropdownMenu.SubContent>
                </DropdownMenu.Sub>
                <DropdownMenu.Separator />
                <DropdownMenu.Item>
                    Delete
                    <DropdownMenu.Shortcut>⌘⌫</DropdownMenu.Shortcut>
                </DropdownMenu.Item>
            </DropdownMenu.Content>
        </DropdownMenu>
    );
};
