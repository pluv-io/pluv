import { MixerHorizontalIcon } from "@pluv-internal/react-icons";
import { DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";
import { Table } from "@tanstack/react-table";
import { Button } from "../../../either/atoms/Button";
import { DropdownMenu } from "../../atoms/DropdownMenu";

export interface DataTableViewOptionsProps<TData extends unknown> {
    table: Table<TData>;
}

export const DataTableViewOptions = <TData extends unknown>({ table }: DataTableViewOptionsProps<TData>) => {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="ml-auto hidden h-8 lg:flex">
                    <MixerHorizontalIcon className="mr-2 size-4" />
                    View
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenu.Content align="end" className="w-[150px]">
                <DropdownMenu.Label>Toggle columns</DropdownMenu.Label>
                <DropdownMenu.Separator />
                {table
                    .getAllColumns()
                    .filter((column) => typeof column.accessorFn !== "undefined" && column.getCanHide())
                    .map((column) => {
                        return (
                            <DropdownMenu.CheckboxItem
                                key={column.id}
                                className="capitalize"
                                checked={column.getIsVisible()}
                                onCheckedChange={(value) => column.toggleVisibility(!!value)}
                            >
                                {column.id}
                            </DropdownMenu.CheckboxItem>
                        );
                    })}
            </DropdownMenu.Content>
        </DropdownMenu>
    );
};
