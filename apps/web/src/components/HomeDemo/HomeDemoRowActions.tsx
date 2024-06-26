"use client";

import { DropdownMenu, toast } from "@pluv-internal/react-components/client";
import { Button } from "@pluv-internal/react-components/either";
import { useRerender } from "@pluv-internal/react-hooks";
import { DotsHorizontalIcon } from "@pluv-internal/react-icons";
import type { Maybe } from "@pluv-internal/typings";
import { debounce } from "@pluv-internal/utils";
import { yjs } from "@pluv/crdt-yjs";
import type { Row, Table } from "@tanstack/react-table";
import ms from "ms";
import { useCallback, useMemo, useState } from "react";
import { useMyPresence, useRoom, useStorage } from "../../pluv-io/cloudflare";
import { MAX_TASKS_COUNT } from "./constants";
import { labels, priorities, statuses } from "./data";
import { taskSchema } from "./schema";
import { PresenceTooltip } from "../PresenceTooltip";
import { usePresenceTooltip } from "../../react-hooks/usePresenceToolip";

interface DataTableRowActionsProps<TData> {
    row: Row<TData>;
    table?: Maybe<Table<TData>>;
}

export const HomeDemoRowActions = <TData extends unknown>({ row, table }: DataTableRowActionsProps<TData>) => {
    const task = taskSchema.parse(row.original);
    const index = row.index;
    const selectionId = `home-demo-actions-${task.id}`;

    const { attributes } = usePresenceTooltip({ selectionId });

    const rerender = useRerender();
    const room = useRoom();
    const [, sharedType] = useStorage("demoTasks", (tasks) => tasks[index] ?? null);

    const copyTask = useMemo(() => {
        return debounce(
            async () => {
                const tasks = room.getStorage("demoTasks");
                const count = tasks?.length ?? 0;

                if (count >= MAX_TASKS_COUNT) {
                    toast.error("Task limit reached");

                    return;
                }

                sharedType?.unshift(yjs.object(task));

                toast.success(`${task.id} created`);

                rerender();
            },
            { wait: ms("300ms") },
        );
    }, [rerender, room, sharedType, task]);

    const getSelectedIndices = useCallback((): number[] => {
        const selected = table?.getSelectedRowModel();

        return selected?.rows.map((selectedRow) => selectedRow.index) ?? [];
    }, [table]);
    const getSelectedTaskSharedTypes = useCallback(() => {
        const indices = getSelectedIndices();
        return indices.length
            ? indices.map((i) => sharedType?.value.get(i) ?? null)
            : [sharedType?.value.get(index) ?? null];
    }, [getSelectedIndices, index, sharedType]);

    return (
        <DropdownMenu>
            <PresenceTooltip selectionId={selectionId}>
                <PresenceTooltip.Trigger>
                    <DropdownMenu.Trigger asChild>
                        <Button variant="ghost" className="flex size-8 p-0 data-[state=open]:bg-muted">
                            <DotsHorizontalIcon className="size-4" />
                            <span className="sr-only">Open menu</span>
                        </Button>
                    </DropdownMenu.Trigger>
                </PresenceTooltip.Trigger>
                <PresenceTooltip.Content />
            </PresenceTooltip>
            <DropdownMenu.Content {...attributes} align="end" className="w-[160px]">
                <DropdownMenu.Item>Edit</DropdownMenu.Item>
                <DropdownMenu.Item
                    disabled={getSelectedIndices().length > 1}
                    onClick={() => {
                        copyTask();

                        setTimeout(() => {
                            rerender();
                        }, 0);
                    }}
                >
                    Make a copy
                </DropdownMenu.Item>
                <DropdownMenu.Separator />
                <DropdownMenu.Sub>
                    <DropdownMenu.SubTrigger>Labels</DropdownMenu.SubTrigger>
                    <DropdownMenu.SubContent>
                        <DropdownMenu.RadioGroup
                            onValueChange={(newValue) => {
                                const taskSharedTypes = getSelectedTaskSharedTypes();

                                taskSharedTypes.forEach((taskSharedType) => {
                                    taskSharedType?.set("label", newValue);
                                });

                                setTimeout(() => {
                                    rerender();
                                }, 0);
                            }}
                            value={task.label}
                        >
                            {labels.map((label) => (
                                <DropdownMenu.RadioItem key={label.value} value={label.value}>
                                    {label.label}
                                </DropdownMenu.RadioItem>
                            ))}
                        </DropdownMenu.RadioGroup>
                    </DropdownMenu.SubContent>
                </DropdownMenu.Sub>
                <DropdownMenu.Sub>
                    <DropdownMenu.SubTrigger>Statuses</DropdownMenu.SubTrigger>
                    <DropdownMenu.SubContent>
                        <DropdownMenu.RadioGroup
                            onValueChange={(newValue) => {
                                const taskSharedTypes = getSelectedTaskSharedTypes();

                                taskSharedTypes.forEach((taskSharedType) => {
                                    taskSharedType?.set("status", newValue);
                                });

                                setTimeout(() => {
                                    rerender();
                                }, 0);
                            }}
                            value={task.status}
                        >
                            {statuses.map((status) => (
                                <DropdownMenu.RadioItem key={status.value} value={status.value}>
                                    {status.label}
                                </DropdownMenu.RadioItem>
                            ))}
                        </DropdownMenu.RadioGroup>
                    </DropdownMenu.SubContent>
                </DropdownMenu.Sub>
                <DropdownMenu.Sub>
                    <DropdownMenu.SubTrigger>Priorities</DropdownMenu.SubTrigger>
                    <DropdownMenu.SubContent>
                        <DropdownMenu.RadioGroup
                            onValueChange={(newValue) => {
                                const taskSharedTypes = getSelectedTaskSharedTypes();

                                taskSharedTypes.forEach((taskSharedType) => {
                                    taskSharedType?.set("priority", newValue);
                                });

                                setTimeout(() => {
                                    rerender();
                                }, 0);
                            }}
                            value={task.priority}
                        >
                            {priorities.map((priority) => (
                                <DropdownMenu.RadioItem key={priority.value} value={priority.value}>
                                    {priority.label}
                                </DropdownMenu.RadioItem>
                            ))}
                        </DropdownMenu.RadioGroup>
                    </DropdownMenu.SubContent>
                </DropdownMenu.Sub>
                <DropdownMenu.Separator />
                <DropdownMenu.Item
                    onClick={() => {
                        const indices = getSelectedIndices();
                        const selectedIndices = indices.length ? indices : [index];

                        selectedIndices.forEach((i) => {
                            sharedType?.delete(i);
                        });

                        setTimeout(() => {
                            rerender();
                        }, 0);
                    }}
                >
                    Delete
                    <DropdownMenu.Shortcut>⌘⌫</DropdownMenu.Shortcut>
                </DropdownMenu.Item>
            </DropdownMenu.Content>
        </DropdownMenu>
    );
};
