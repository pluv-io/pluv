import type { Meta, StoryObj } from "@storybook/react";
import {
    HomeTypeSafetyDemoSection,
    HomeTypeSafetyDemoSectionProps,
} from "@pluv-apps/web/components";

export default {
    title: "web/components/HomeTypeSafetyDemoSection",
    component: HomeTypeSafetyDemoSection,
} as Meta;

type Story = StoryObj<HomeTypeSafetyDemoSectionProps>;

const Template: Story = {
    render: (args) => {
        return <HomeTypeSafetyDemoSection {...args} />;
    },
};

export const Standard: Story = { ...Template };
