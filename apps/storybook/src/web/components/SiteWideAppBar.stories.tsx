import type { Meta, Story } from "@storybook/react";
import type { SiteWideAppBarProps } from "@pluv-apps/web/components";
import { SiteWideAppBar } from "@pluv-apps/web/components";

export default {
    title: "web/components/SiteWideAppBar",
    component: SiteWideAppBar,
} as Meta;

const Template: Story<SiteWideAppBarProps> = (args) => {
    return <SiteWideAppBar {...args} />;
};
Template.args = {};
Template.parameters = {
    layout: "fullscreen",
};

export const Standard = Template.bind({});
Standard.args = { ...Template.args };
Standard.parameters = { ...Template.parameters };
