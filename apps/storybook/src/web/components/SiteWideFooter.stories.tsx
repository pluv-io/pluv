import type { Meta, Story } from "@storybook/react";
import type { SiteWideFooterProps } from "@pluv-apps/web/components";
import { SiteWideFooter } from "@pluv-apps/web/components";

export default {
    title: "web/components/SiteWideFooter",
    component: SiteWideFooter,
} as Meta;

const Template: Story<SiteWideFooterProps> = (args) => {
    return <SiteWideFooter {...args} />;
};
Template.args = {};
Template.parameters = {
    layout: "fullscreen",
};

export const Standard = Template.bind({});
Standard.args = { ...Template.args };
Standard.parameters = { ...Template.parameters };
