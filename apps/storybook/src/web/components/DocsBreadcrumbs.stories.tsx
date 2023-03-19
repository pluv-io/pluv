import type { Meta, Story } from "@storybook/react";
import type { DocsBreadcrumbsProps } from "@pluv-apps/web/components";
import { DocsBreadcrumbs } from "@pluv-apps/web/components";

export default {
    title: "web/components/DocsBreadcrumbs",
    component: DocsBreadcrumbs,
} as Meta;

const Template: Story<DocsBreadcrumbsProps> = (args) => {
    return <DocsBreadcrumbs {...args} />;
};
Template.args = {};
Template.parameters = {
    nextRouter: {
        pathname: "/docs/io/basic-setup",
    },
};

export const Standard = Template.bind({});
Standard.args = { ...Template.args };
Standard.parameters = { ...Template.parameters };
