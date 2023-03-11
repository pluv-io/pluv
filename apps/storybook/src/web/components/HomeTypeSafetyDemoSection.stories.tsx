import type { Meta, Story } from "@storybook/react";
import type { HomeTypeSafetyDemoSectionProps } from "@pluv-apps/web/components";
import { HomeTypeSafetyDemoSection } from "@pluv-apps/web/components";

export default {
    title: "web/components/HomeTypeSafetyDemoSection",
    component: HomeTypeSafetyDemoSection,
} as Meta;

const Template: Story<HomeTypeSafetyDemoSectionProps> = (args) => {
    return <HomeTypeSafetyDemoSection {...args} />;
};
Template.args = {};

export const Standard = Template.bind({});
Standard.args = { ...Template.args };
