import type { Meta, Story } from "@storybook/react";
import type { HomeBoxesDemoSectionProps } from "@pluv-apps/web/components";
import { HomeBoxesDemoSection } from "@pluv-apps/web/components";

export default {
    title: "web/components/HomeBoxesDemoSection",
    component: HomeBoxesDemoSection,
} as Meta;

const Template: Story<HomeBoxesDemoSectionProps> = (args) => {
    return <HomeBoxesDemoSection {...args} />;
};
Template.args = {};

export const Standard = Template.bind({});
Standard.args = { ...Template.args };
