import type { Meta, Story } from "@storybook/react";
import type { DocsTreeViewNavigationProps } from "@pluv-apps/web/components";
import { DocsTreeViewNavigation } from "@pluv-apps/web/components";

export default {
    title: "web/components/DocsTreeViewNavigation",
    component: DocsTreeViewNavigation,
} as Meta;

const Template: Story<DocsTreeViewNavigationProps> = (args) => {
    return <DocsTreeViewNavigation {...args} />;
};
Template.args = {};

export const Standard = Template.bind({});
Standard.args = { ...Template.args };
