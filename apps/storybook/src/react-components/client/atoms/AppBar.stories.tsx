import { AppBar } from "@pluv-internal/react-components/client";
import type { Meta, StoryObj } from "@storybook/react";

const meta: Meta<typeof AppBar> = {
    title: "components/client/atoms/AppBar",
    component: AppBar,
};

export default meta;

type Story = StoryObj<typeof AppBar>;

export const Basic: Story = {
    render: (args) => <AppBar {...args} />,
    args: {
        active: true,
    },
};

export const Scrollable: Story = {
    render: (args) => (
        <>
            <AppBar {...args} />
            <div style={{ height: "200vh" }} />
        </>
    ),
};
