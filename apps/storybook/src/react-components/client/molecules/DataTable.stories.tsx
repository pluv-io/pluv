import { Checkbox, DataTable, DropdownMenu } from "@pluv-internal/react-components/client";
import { Button } from "@pluv-internal/react-components/either";
import { ChevronUpDownIcon, DotsHorizontalIcon } from "@pluv-internal/react-icons";
import type { Meta, StoryObj } from "@storybook/react";
import type { ColumnDef } from "@tanstack/react-table";

const data: Payment[] = [
    {
        id: "m5gr84i9",
        amount: 316,
        status: "success",
        email: "ken99@yahoo.com",
    },
    {
        id: "3u1reuv4",
        amount: 242,
        status: "success",
        email: "Abe45@gmail.com",
    },
    {
        id: "derv1ws0",
        amount: 837,
        status: "processing",
        email: "Monserrat44@gmail.com",
    },
    {
        id: "5kma53ae",
        amount: 874,
        status: "success",
        email: "Silas22@gmail.com",
    },
    {
        id: "bhqecj4p",
        amount: 721,
        status: "failed",
        email: "carmella@hotmail.com",
    },
];

export type Payment = {
    id: string;
    amount: number;
    status: "pending" | "processing" | "success" | "failed";
    email: string;
};

const meta: Meta<typeof DataTable<Payment>> = {
    title: "components/client/molecules/DataTable",
    component: DataTable,
};

export default meta;

type Story = StoryObj<typeof DataTable<Payment>>;

const Template: Story = {
    render: (args) => {
        const columns: ColumnDef<Payment>[] = [
            {
                id: "select",
                header: ({ table }) => (
                    <Checkbox
                        checked={
                            table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")
                        }
                        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                        aria-label="Select all"
                    />
                ),
                cell: ({ row }) => (
                    <Checkbox
                        checked={row.getIsSelected()}
                        onCheckedChange={(value) => row.toggleSelected(!!value)}
                        aria-label="Select row"
                    />
                ),
                enableSorting: false,
                enableHiding: false,
            },
            {
                accessorKey: "status",
                header: "Status",
                cell: ({ row }) => <div className="capitalize">{row.getValue("status")}</div>,
            },
            {
                accessorKey: "email",
                header: ({ column }) => {
                    return (
                        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
                            Email
                            <ChevronUpDownIcon className="ml-2 size-4" />
                        </Button>
                    );
                },
                cell: ({ row }) => <div className="lowercase">{row.getValue("email")}</div>,
            },
            {
                accessorKey: "amount",
                header: () => <div className="text-right">Amount</div>,
                cell: ({ row }) => {
                    const amount = parseFloat(row.getValue("amount"));

                    // Format the amount as a dollar amount
                    const formatted = new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                    }).format(amount);

                    return <div className="text-right font-medium">{formatted}</div>;
                },
            },
            {
                id: "actions",
                enableHiding: false,
                cell: ({ row }) => {
                    const payment = row.original;

                    return (
                        <DropdownMenu>
                            <DropdownMenu.Trigger asChild>
                                <Button variant="ghost" className="size-8 p-0">
                                    <span className="sr-only">Open menu</span>
                                    <DotsHorizontalIcon className="size-4" />
                                </Button>
                            </DropdownMenu.Trigger>
                            <DropdownMenu.Content align="end">
                                <DropdownMenu.Label>Actions</DropdownMenu.Label>
                                <DropdownMenu.Item>Copy payment ID</DropdownMenu.Item>
                                <DropdownMenu.Separator />
                                <DropdownMenu.Item>View customer</DropdownMenu.Item>
                                <DropdownMenu.Item>View payment details</DropdownMenu.Item>
                            </DropdownMenu.Content>
                        </DropdownMenu>
                    );
                },
            },
        ];

        return <DataTable columns={columns} data={data} />;
    },
};

export const Standard: Story = { ...Template };
