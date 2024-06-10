import { Dialog, Label } from "@pluv-internal/react-components/client";
import { Button, Input } from "@pluv-internal/react-components/either";
import type { Meta, StoryObj } from "@storybook/react";

const meta: Meta<typeof Dialog> = {
    title: "components/client/atoms/Dialog",
    component: Dialog,
};

export default meta;

type Story = StoryObj<typeof Dialog>;

export const Basic: Story = {
    render: (args) => (
        <Dialog {...args}>
            <Dialog.Trigger asChild>
                <Button type="button">Edit Profile</Button>
            </Dialog.Trigger>
            <Dialog.Content className="sm:max-w-[425px]">
                <Dialog.Header>
                    <Dialog.Title>Edit profile</Dialog.Title>
                    <Dialog.Description>
                        Make changes to your profile here. Click save when you&apos;re done.
                    </Dialog.Description>
                </Dialog.Header>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                            Name
                        </Label>
                        <Input id="name" defaultValue="Pedro Duarte" className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="username" className="text-right">
                            Username
                        </Label>
                        <Input id="username" defaultValue="@peduarte" className="col-span-3" />
                    </div>
                </div>
                <Dialog.Footer>
                    <Button type="submit">Save changes</Button>
                </Dialog.Footer>
            </Dialog.Content>
        </Dialog>
    ),
};
