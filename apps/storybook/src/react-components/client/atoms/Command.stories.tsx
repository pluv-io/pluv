import { Command } from "@pluv-internal/react-components/client";
import { CalendarIcon, CreditCardIcon, SettingsIcon, UserIcon } from "@pluv-internal/react-icons";
import type { Meta, StoryObj } from "@storybook/react";

const meta: Meta<typeof Command> = {
    title: "components/client/atoms/Command",
    component: Command,
};

export default meta;

type Story = StoryObj<typeof Command>;

export const Basic: Story = {
    render: (args) => (
        <Command {...args} className="rounded-lg border shadow-md">
            <Command.Input placeholder="Type a command or search..." />
            <Command.List>
                <Command.Empty>No results found.</Command.Empty>
                <Command.Group heading="Suggestions">
                    <Command.Item>
                        <CalendarIcon className="mr-2 size-4" />
                        <span>Calendar</span>
                    </Command.Item>
                </Command.Group>
                <Command.Separator />
                <Command.Group heading="Settings">
                    <Command.Item>
                        <UserIcon className="mr-2 size-4" />
                        <span>Profile</span>
                        <Command.Shortcut>⌘P</Command.Shortcut>
                    </Command.Item>
                    <Command.Item>
                        <CreditCardIcon className="mr-2 size-4" />
                        <span>Billing</span>
                        <Command.Shortcut>⌘B</Command.Shortcut>
                    </Command.Item>
                    <Command.Item>
                        <SettingsIcon className="mr-2 size-4" />
                        <span>Settings</span>
                        <Command.Shortcut>⌘S</Command.Shortcut>
                    </Command.Item>
                </Command.Group>
            </Command.List>
        </Command>
    ),
};
