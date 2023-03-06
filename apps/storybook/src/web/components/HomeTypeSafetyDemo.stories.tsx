import type { Meta, Story } from "@storybook/react";
import type { HomeTypeSafetyDemoProps } from "@pluv-apps/web/components";
import { HomeTypeSafetyDemo } from "@pluv-apps/web/components";

export default {
    title: "web/components/HomeTypeSafetyDemo",
    component: HomeTypeSafetyDemo,
} as Meta;

const Template: Story<HomeTypeSafetyDemoProps> = (args) => {
    return <HomeTypeSafetyDemo {...args} />;
};
Template.args = {};

export const Standard = Template.bind({});
Standard.args = { ...Template.args };
