import { useRerender } from "@pluv-internal/react-hooks";
import { MixerHorizontalIcon } from "@pluv-internal/react-icons";
import type { Maybe } from "@pluv-internal/typings";
import { cn } from "@pluv-internal/utils";
import { DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";
import type { Table } from "@tanstack/react-table";
import { Button } from "../../../either/atoms/Button";
import { DropdownMenu } from "../../atoms/DropdownMenu";

export interface DataTableViewOptionsProps<TData extends unknown> {
    className?: string;
    table?: Maybe<Table<TData>>;
}

export const DataTableViewOptions = <TData extends unknown>({ className, table }: DataTableViewOptionsProps<TData>) => {
    const rerender = useRerender();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button className={cn("ml-auto hidden h-8 lg:flex", className)} variant="outline" size="sm">
                    <MixerHorizontalIcon className="mr-2 size-4" />
                    View
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenu.Content align="end" className="w-[150px]">
                <DropdownMenu.Label>Toggle columns</DropdownMenu.Label>
                <DropdownMenu.Separator />
                {table
                    ?.getAllColumns()
                    .filter((column) => typeof column.accessorFn !== "undefined" && column.getCanHide())
                    .map((column) => {
                        return (
                            <DropdownMenu.CheckboxItem
                                key={column.id}
                                className="capitalize"
                                checked={column.getIsVisible()}
                                onCheckedChange={(value) => {
                                    column.toggleVisibility(!!value);

                                    setTimeout(() => {
                                        rerender();
                                    }, 0);
                                }}
                            >
                                {column.id}
                            </DropdownMenu.CheckboxItem>
                        );
                    })}
            </DropdownMenu.Content>
        </DropdownMenu>
    );
};
