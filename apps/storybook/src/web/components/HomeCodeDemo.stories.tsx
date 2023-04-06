import type { Meta, StoryObj } from "@storybook/react";
import type { HomeCodeDemoProps } from "@pluv-apps/web/components";
import { HomeCodeDemo } from "@pluv-apps/web/components";

export default {
    title: "web/components/HomeCodeDemo",
    component: HomeCodeDemo,
} as Meta;

type Story = StoryObj<HomeCodeDemoProps>;

const Template: Story = {
    render: (args) => {
        return <HomeCodeDemo {...args} />;
    },
    parameters: {
        layout: "fullscreen",
    },
};

export const Standard: Story = { ...Template };
