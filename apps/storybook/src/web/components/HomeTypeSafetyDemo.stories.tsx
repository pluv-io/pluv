import type { Meta, StoryObj } from "@storybook/react";
import {
    HomeTypeSafetyDemo,
    HomeTypeSafetyDemoProps,
} from "@pluv-apps/web/components";

export default {
    title: "web/components/HomeTypeSafetyDemo",
    component: HomeTypeSafetyDemo,
} as Meta;

type Story = StoryObj<HomeTypeSafetyDemoProps>;

const Template: Story = {
    render: (args) => {
        return <HomeTypeSafetyDemo {...args} />;
    },
};

export const Standard: Story = { ...Template };
