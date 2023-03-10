import type { Meta, Story } from "@storybook/react";
import type { HomeCodeDemoProps } from "@pluv-apps/web/components";
import { HomeCodeDemo } from "@pluv-apps/web/components";

export default {
    title: "web/components/HomeCodeDemo",
    component: HomeCodeDemo,
} as Meta;

const Template: Story<HomeCodeDemoProps> = (args) => {
    return <HomeCodeDemo {...args} />;
};
Template.args = {};
Template.parameters = {
    layout: "fullscreen",
};

export const Standard = Template.bind({});
Standard.args = { ...Template.args };
Standard.parameters = { ...Template.parameters };
