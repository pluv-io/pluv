import { Label, Switch } from "@pluv-internal/react-components/client";
import type { Meta, StoryObj } from "@storybook/react";

const meta: Meta<typeof Switch> = {
    title: "components/client/atoms/Switch",
    component: Switch,
};

export default meta;

type Story = StoryObj<typeof Switch>;

export const Basic: Story = {
    render: (args) => (
        <div className="flex items-center space-x-2">
            <Switch id="airplane-mode" />
            <Label htmlFor="airplane-mode">Airplane Mode</Label>
        </div>
    ),
};
