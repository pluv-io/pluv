import type { Meta, Story } from "@storybook/react";
import type { SiteWideLayoutProps } from "@pluv-apps/web/components";
import { SiteWideLayout } from "@pluv-apps/web/components";

export default {
    title: "web/components/SiteWideLayout",
    component: SiteWideLayout,
} as Meta;

const Template: Story<SiteWideLayoutProps> = (args) => {
    return <SiteWideLayout {...args} />;
};
Template.args = {};
Template.parameters = {
    layout: "fullscreen",
};

export const Standard = Template.bind({});
Standard.args = { ...Template.args };
Standard.parameters = { ...Template.parameters };
