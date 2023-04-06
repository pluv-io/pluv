import type { AppBarProps } from "@pluv-internal/react-components";
import { AppBar } from "@pluv-internal/react-components";
import type { Meta, StoryObj } from "@storybook/react";

export default {
    title: "react-components/atoms/AppBar",
    component: AppBar,
} as Meta;

type Story = StoryObj<AppBarProps>;

const Template: Story = {
    render: (args) => {
        return <AppBar {...args} />;
    },
    parameters: {
        layout: "fullscreen",
    },
};

export const Standard = { ...Template };
