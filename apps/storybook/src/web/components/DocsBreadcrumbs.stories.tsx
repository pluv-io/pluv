import type { DocsBreadcrumbsProps } from "@pluv-apps/web/components";
import { DocsBreadcrumbs } from "@pluv-apps/web/components";
import type { Meta, StoryObj } from "@storybook/react";

export default {
    title: "web/components/DocsBreadcrumbs",
    component: DocsBreadcrumbs,
} as Meta;

type Story = StoryObj<DocsBreadcrumbsProps>;

const Template: Story = {
    render: (args) => {
        return <DocsBreadcrumbs {...args} />;
    },
    parameters: {
        nextRouter: {
            pathname: "/docs/io/basic-setup",
        },
    },
};

export const Standard: Story = { ...Template };
