import { SideBar } from "@pluv-internal/react-components/either";
import type { Meta, StoryObj } from "@storybook/react";

const meta: Meta<typeof SideBar> = {
    title: "components/either/atoms/SideBar",
    component: SideBar,
};

export default meta;

type Story = StoryObj<typeof SideBar>;

const Template: Story = {
    render: (args) => {
        return <SideBar {...args} />;
    },
    parameters: {
        layout: "fullscreen",
    },
};

export const Standard = { ...Template };
