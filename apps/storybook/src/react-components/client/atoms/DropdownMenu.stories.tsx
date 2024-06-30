import { DropdownMenu } from "@pluv-internal/react-components/client";
import { Button } from "@pluv-internal/react-components/either";
import type { Meta, StoryObj } from "@storybook/react";

const meta: Meta<typeof DropdownMenu> = {
    title: "components/client/atoms/DropdownMenu",
    component: DropdownMenu,
};

export default meta;

type Story = StoryObj<typeof DropdownMenu>;

export const Basic: Story = {
    render: (args) => {
        return (
            <DropdownMenu {...args}>
                <DropdownMenu.Trigger asChild>
                    <Button>Open</Button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Content className="w-56">
                    <DropdownMenu.Label>My Account</DropdownMenu.Label>
                    <DropdownMenu.Separator />
                    <DropdownMenu.Group>
                        <DropdownMenu.Item>
                            <span>Profile</span>
                            <DropdownMenu.Shortcut>⇧⌘P</DropdownMenu.Shortcut>
                        </DropdownMenu.Item>
                        <DropdownMenu.Item>
                            <span>Billing</span>
                            <DropdownMenu.Shortcut>⌘B</DropdownMenu.Shortcut>
                        </DropdownMenu.Item>
                        <DropdownMenu.Item>
                            <span>Settings</span>
                            <DropdownMenu.Shortcut>⌘S</DropdownMenu.Shortcut>
                        </DropdownMenu.Item>
                        <DropdownMenu.Item>
                            <span>Keyboard shortcuts</span>
                            <DropdownMenu.Shortcut>⌘K</DropdownMenu.Shortcut>
                        </DropdownMenu.Item>
                    </DropdownMenu.Group>
                    <DropdownMenu.Separator />
                    <DropdownMenu.Group>
                        <DropdownMenu.Item>
                            <span>Team</span>
                        </DropdownMenu.Item>
                        <DropdownMenu.Sub>
                            <DropdownMenu.SubTrigger>
                                <span>Invite users</span>
                            </DropdownMenu.SubTrigger>
                            <DropdownMenu.Portal>
                                <DropdownMenu.SubContent>
                                    <DropdownMenu.Item>
                                        <span>Email</span>
                                    </DropdownMenu.Item>
                                    <DropdownMenu.Item>
                                        <span>Message</span>
                                    </DropdownMenu.Item>
                                    <DropdownMenu.Separator />
                                    <DropdownMenu.Item>
                                        <span>More...</span>
                                    </DropdownMenu.Item>
                                </DropdownMenu.SubContent>
                            </DropdownMenu.Portal>
                        </DropdownMenu.Sub>
                        <DropdownMenu.Item>
                            <span>New Team</span>
                            <DropdownMenu.Shortcut>⌘+T</DropdownMenu.Shortcut>
                        </DropdownMenu.Item>
                    </DropdownMenu.Group>
                    <DropdownMenu.Separator />
                    <DropdownMenu.Item>
                        <span>GitHub</span>
                    </DropdownMenu.Item>
                    <DropdownMenu.Item>
                        <span>Support</span>
                    </DropdownMenu.Item>
                    <DropdownMenu.Item disabled>
                        <span>API</span>
                    </DropdownMenu.Item>
                    <DropdownMenu.Separator />
                    <DropdownMenu.Item>
                        <span>Log out</span>
                        <DropdownMenu.Shortcut>⇧⌘Q</DropdownMenu.Shortcut>
                    </DropdownMenu.Item>
                </DropdownMenu.Content>
            </DropdownMenu>
        );
    },
};
