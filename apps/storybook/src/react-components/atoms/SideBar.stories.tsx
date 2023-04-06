import type { SideBarProps } from "@pluv-internal/react-components";
import { SideBar } from "@pluv-internal/react-components";
import type { Meta, StoryObj } from "@storybook/react";

export default {
    title: "react-components/atoms/SideBar",
    component: SideBar,
} as Meta;

type Story = StoryObj<SideBarProps>;

const Template: Story = {
    render: (args) => {
        return <SideBar {...args} />;
    },
    parameters: {
        layout: "fullscreen",
    },
};

export const Standard = { ...Template };
