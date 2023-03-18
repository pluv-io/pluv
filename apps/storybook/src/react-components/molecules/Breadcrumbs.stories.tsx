import type { BreadcrumbsProps } from "@pluv-internal/react-components";
import { Breadcrumbs } from "@pluv-internal/react-components";
import type { Meta, Story } from "@storybook/react";

export default {
    title: "react-components/molecules/Breadcrumbs",
    component: Breadcrumbs,
} as Meta;

const Template: Story<BreadcrumbsProps> = (args) => {
    return (
        <Breadcrumbs {...args}>
            <Breadcrumbs.Item href="https://google.com">
                Google
            </Breadcrumbs.Item>
            <Breadcrumbs.Item href="https://google.com">
                Google
            </Breadcrumbs.Item>
            <Breadcrumbs.Item href="https://google.com">
                Google
            </Breadcrumbs.Item>
        </Breadcrumbs>
    );
};
Template.args = {};

export const Standard = Template.bind({});
Standard.args = { ...Template.args };
