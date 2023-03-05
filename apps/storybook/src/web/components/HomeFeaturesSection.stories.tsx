import type { Meta, Story } from "@storybook/react";
import type { HomeFeaturesSectionProps } from "@pluv-apps/web/components";
import { HomeFeaturesSection } from "@pluv-apps/web/components";

export default {
    title: "web/components/HomeFeaturesSection",
    component: HomeFeaturesSection,
} as Meta;

const Template: Story<HomeFeaturesSectionProps> = (args) => {
    return <HomeFeaturesSection {...args} />;
};
Template.args = {};

export const Standard = Template.bind({});
Standard.args = { ...Template.args };
