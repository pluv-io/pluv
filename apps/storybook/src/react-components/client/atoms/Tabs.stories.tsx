import { Label, Tabs } from "@pluv-internal/react-components/client";
import { Button, Card, Input } from "@pluv-internal/react-components/either";
import type { Meta, StoryObj } from "@storybook/react";

const meta: Meta<typeof Tabs> = {
    title: "components/client/atoms/Tabs",
    component: Tabs,
};

export default meta;

type Story = StoryObj<typeof Tabs>;

export const Basic: Story = {
    render: (args) => {
        return (
            <Tabs defaultValue="account" className="w-[400px]">
                <Tabs.List className="grid w-full grid-cols-2">
                    <Tabs.Trigger value="account">Account</Tabs.Trigger>
                    <Tabs.Trigger value="password">Password</Tabs.Trigger>
                </Tabs.List>
                <Tabs.Content value="account">
                    <Card>
                        <Card.Header>
                            <Card.Title>Account</Card.Title>
                            <Card.Description>
                                Make changes to your account here. Click save when you&apos;re done.
                            </Card.Description>
                        </Card.Header>
                        <Card.Content className="space-y-2">
                            <div className="space-y-1">
                                <Label htmlFor="name">Name</Label>
                                <Input id="name" defaultValue="Pedro Duarte" />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="username">Username</Label>
                                <Input id="username" defaultValue="@peduarte" />
                            </div>
                        </Card.Content>
                        <Card.Footer>
                            <Button>Save changes</Button>
                        </Card.Footer>
                    </Card>
                </Tabs.Content>
                <Tabs.Content value="password">
                    <Card>
                        <Card.Header>
                            <Card.Title>Password</Card.Title>
                            <Card.Description>
                                Change your password here. After saving, you&apos;ll be logged out.
                            </Card.Description>
                        </Card.Header>
                        <Card.Content className="space-y-2">
                            <div className="space-y-1">
                                <Label htmlFor="current">Current password</Label>
                                <Input id="current" type="password" />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="new">New password</Label>
                                <Input id="new" type="password" />
                            </div>
                        </Card.Content>
                        <Card.Footer>
                            <Button>Save password</Button>
                        </Card.Footer>
                    </Card>
                </Tabs.Content>
            </Tabs>
        );
    },
};
