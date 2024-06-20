"use client";

import { DataTable } from "@pluv-internal/react-components/client";
import { Button, Input } from "@pluv-internal/react-components/either";
import { XIcon } from "@pluv-internal/react-icons";
import type { Maybe } from "@pluv-internal/typings";
import type { Table } from "@tanstack/react-table";
import { priorities, statuses } from "./data";

interface DataTableToolbarProps<TData> {
    table?: Maybe<Table<TData>>;
}

export const HomeDemoToolbar = <TData extends unknown>({ table }: DataTableToolbarProps<TData>) => {
    if (!table) return null;

    const isFiltered = table.getState().columnFilters.length > 0;

    return (
        <div className="flex items-center justify-between">
            <div className="flex flex-1 items-center space-x-2">
                <Input
                    placeholder="Filter tasks..."
                    value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
                    onChange={(event) => table.getColumn("title")?.setFilterValue(event.target.value)}
                    className="h-8 w-[150px] lg:w-[250px]"
                />
                {table.getColumn("status") && (
                    <DataTable.FacetedFilter column={table.getColumn("status")} title="Status" options={statuses} />
                )}
                {table.getColumn("priority") && (
                    <DataTable.FacetedFilter
                        column={table.getColumn("priority")}
                        title="Priority"
                        options={priorities}
                    />
                )}
                {isFiltered && (
                    <Button variant="ghost" onClick={() => table.resetColumnFilters()} className="h-8 px-2 lg:px-3">
                        Reset
                        <XIcon className="ml-2 size-4" />
                    </Button>
                )}
            </div>
            <DataTable.ViewOptions table={table} />
        </div>
    );
};
