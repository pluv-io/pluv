"use client";

import { Checkbox, DataTableColumnHeader, toast } from "@pluv-internal/react-components/client";
import { Badge, Input } from "@pluv-internal/react-components/either";
import { debounce } from "@pluv-internal/utils";
import type { ColumnDef } from "@tanstack/react-table";
import { PresenceTooltip } from "../PresenceTooltip";
import { HomeDemoRowActions } from "./HomeDemoRowActions";
import { labels, priorities, statuses } from "./data";
import { taskSchema, type Task } from "./schema";

export const HomeDemoColumns: ColumnDef<Task>[] = [
    {
        id: "select",
        header: ({ table }) => {
            const selectionId = "home-demo-select-header";

            return (
                <PresenceTooltip selectionId={selectionId}>
                    <PresenceTooltip.Trigger>
                        <Checkbox
                            checked={
                                table.getIsAllPageRowsSelected() ||
                                (table.getIsSomePageRowsSelected() && "indeterminate")
                            }
                            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                            aria-label="Select all"
                            className="translate-y-[2px]"
                        />
                    </PresenceTooltip.Trigger>
                    <PresenceTooltip.Content />
                </PresenceTooltip>
            );
        },
        cell: ({ row }) => {
            const task = taskSchema.parse(row.original);
            const selectionId = `home-demo-select-${task.id}`;

            return (
                <PresenceTooltip selectionId={selectionId}>
                    <PresenceTooltip.Trigger>
                        <Checkbox
                            checked={row.getIsSelected()}
                            onCheckedChange={(value) => row.toggleSelected(!!value)}
                            aria-label="Select row"
                            className="translate-y-[2px]"
                        />
                    </PresenceTooltip.Trigger>
                    <PresenceTooltip.Content />
                </PresenceTooltip>
            );
        },
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: "id",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Task" />,
        cell: ({ row }) => <div className="w-[80px]">{row.getValue("id")}</div>,
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: "title",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Title" />,
        cell: ({ row }) => {
            const task = taskSchema.parse(row.original);
            const selectionId = `home-demo-title-${task.id}`;

            const label = labels.find((label) => label.value === row.original.label);

            const showToast = debounce(
                () => {
                    toast.info("Title edits are disabled for demonstration purposes");
                },
                { wait: 300 },
            );

            return (
                <div className="flex space-x-2">
                    {label && <Badge variant="outline">{label.label}</Badge>}
                    <PresenceTooltip selectionId={selectionId}>
                        <PresenceTooltip.Trigger>
                            <Input
                                className="pointer-events-auto max-w-[500px] cursor-text truncate bg-inherit px-2 font-medium"
                                contentEditable
                                onChange={() => {
                                    showToast();
                                }}
                                spellCheck={false}
                                value={row.getValue("title") as string}
                                aria-label="Task title"
                            />
                        </PresenceTooltip.Trigger>
                        <PresenceTooltip.Content />
                    </PresenceTooltip>
                </div>
            );
        },
    },
    {
        accessorKey: "status",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => {
            const status = statuses.find((status) => status.value === row.getValue("status"));

            if (!status) {
                return null;
            }

            return (
                <div className="flex w-[100px] items-center">
                    {status.icon && <status.icon className="mr-2 size-4 text-muted-foreground" />}
                    <span>{status.label}</span>
                </div>
            );
        },
        filterFn: (row, id, value) => {
            return value.includes(row.getValue(id));
        },
    },
    {
        accessorKey: "priority",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Priority" />,
        cell: ({ row }) => {
            const priority = priorities.find((priority) => priority.value === row.getValue("priority"));

            if (!priority) {
                return null;
            }

            return (
                <div className="flex items-center">
                    {priority.icon && <priority.icon className="mr-2 size-4 text-muted-foreground" />}
                    <span>{priority.label}</span>
                </div>
            );
        },
        filterFn: (row, id, value) => {
            return value.includes(row.getValue(id));
        },
    },
    {
        id: "actions",
        cell: ({ row, table }) => <HomeDemoRowActions row={row} table={table} />,
    },
];
