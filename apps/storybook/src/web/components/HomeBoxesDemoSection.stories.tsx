import type { Meta, StoryObj } from "@storybook/react";
import type { HomeBoxesDemoSectionProps } from "@pluv-apps/web/components";
import { HomeBoxesDemoSection } from "@pluv-apps/web/components";

export default {
    title: "web/components/HomeBoxesDemoSection",
    component: HomeBoxesDemoSection,
} as Meta;

type Story = StoryObj<HomeBoxesDemoSectionProps>;

const Template: Story = {
    render: (args) => {
        return <HomeBoxesDemoSection {...args} />;
    },
};

export const Standard: Story = { ...Template };
