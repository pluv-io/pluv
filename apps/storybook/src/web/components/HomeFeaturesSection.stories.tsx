import type { Meta, StoryObj } from "@storybook/react";
import {
    HomeFeaturesSection,
    HomeFeaturesSectionProps,
} from "@pluv-apps/web/components";

export default {
    title: "web/components/HomeFeaturesSection",
    component: HomeFeaturesSection,
} as Meta;

type Story = StoryObj<HomeFeaturesSectionProps>;

const Template: Story = {
    render: (args) => {
        return <HomeFeaturesSection {...args} />;
    },
};

export const Standard: Story = { ...Template };
