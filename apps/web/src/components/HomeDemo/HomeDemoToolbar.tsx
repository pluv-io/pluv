"use client";

import { DataTable, toast } from "@pluv-internal/react-components/client";
import { Button, Input } from "@pluv-internal/react-components/either";
import { useRerender } from "@pluv-internal/react-hooks";
import { PlusCircleIcon, XIcon } from "@pluv-internal/react-icons";
import type { Maybe } from "@pluv-internal/typings";
import { debounce } from "@pluv-internal/utils";
import { yjs } from "@pluv/crdt-yjs";
import type { Table } from "@tanstack/react-table";
import ms from "ms";
import { useMemo } from "react";
import { useRoom, useStorage } from "../../pluv-io/cloudflare";
import { MAX_TASKS_COUNT } from "./constants";
import { labels, priorities, statuses } from "./data";
import type { Task } from "./schema";

const createTask = async (): Promise<Task> => {
    const faker = await import("@faker-js/faker").then((mod) => mod.faker);

    return {
        id: `TASK-${faker.number.int({ min: 1000, max: 9999 })}`,
        title: faker.hacker.phrase().replace(/^./, (letter) => letter.toUpperCase()),
        status: faker.helpers.arrayElement(statuses).value,
        label: faker.helpers.arrayElement(labels).value,
        priority: faker.helpers.arrayElement(priorities).value,
    };
};

interface DataTableToolbarProps<TData> {
    table?: Maybe<Table<TData>>;
}

export const HomeDemoToolbar = <TData extends unknown>({ table }: DataTableToolbarProps<TData>) => {
    const rerender = useRerender();
    const room = useRoom();

    const [, sharedType] = useStorage("demoTasks", (tasks) => tasks.length);

    const addTask = useMemo(() => {
        return debounce(
            async () => {
                const tasks = room.getStorage("demoTasks");
                const count = tasks?.length ?? 0;

                if (count >= MAX_TASKS_COUNT) {
                    toast.error("Task limit reached");

                    return;
                }

                const task = await createTask();

                sharedType?.unshift(yjs.object(task));

                toast.success(`${task.id} created`);

                rerender();
            },
            { wait: ms("300ms") },
        );
    }, [rerender, room, sharedType]);

    const isFiltered = (table?.getState().columnFilters.length ?? 0) > 0;

    return (
        <div className="flex items-center justify-between" aria-hidden="true">
            <div className="flex flex-1 flex-wrap items-center gap-2">
                <Input
                    placeholder="Filter tasks..."
                    value={(table?.getColumn("title")?.getFilterValue() as string) ?? ""}
                    onChange={(event) => {
                        table?.getColumn("title")?.setFilterValue(event.target.value);

                        setTimeout(() => {
                            rerender();
                        }, 0);
                    }}
                    className="h-8 w-[150px] lg:w-[250px]"
                />
                <Button
                    onClick={() => {
                        addTask();
                    }}
                    size="sm"
                    type="button"
                    variant="outline"
                >
                    <PlusCircleIcon className="mr-2 size-4" />
                    Add new task
                </Button>
                {table?.getColumn("status") && (
                    <DataTable.FacetedFilter column={table.getColumn("status")} title="Status" options={statuses} />
                )}
                {table?.getColumn("priority") && (
                    <DataTable.FacetedFilter
                        column={table.getColumn("priority")}
                        title="Priority"
                        options={priorities}
                    />
                )}
                {isFiltered && (
                    <Button
                        className="h-8 px-2 lg:px-3"
                        variant="ghost"
                        onClick={() => {
                            table?.resetColumnFilters();
                            rerender();
                        }}
                    >
                        Reset
                        <XIcon className="ml-2 size-4" />
                    </Button>
                )}
            </div>
            <DataTable.ViewOptions table={table} />
        </div>
    );
};
