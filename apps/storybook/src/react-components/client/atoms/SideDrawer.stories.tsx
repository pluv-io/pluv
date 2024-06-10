import { SideDrawer } from "@pluv-internal/react-components/client";
import type { Meta, StoryObj } from "@storybook/react";

const meta: Meta<typeof SideDrawer> = {
    title: "components/client/atoms/SideDrawer",
    component: SideDrawer,
};

export default meta;

type Story = StoryObj<typeof SideDrawer>;

export const Basic: Story = {
    render: (args) => <SideDrawer {...args} />,
    args: {
        "data-state": "open",
    },
};
