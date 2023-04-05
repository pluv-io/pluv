import type { BreadcrumbsProps } from "@pluv-internal/react-components";
import { Breadcrumbs } from "@pluv-internal/react-components";
import type { Meta, StoryObj } from "@storybook/react";

export default {
    title: "react-components/molecules/Breadcrumbs",
    component: Breadcrumbs,
} as Meta;

type Story = StoryObj<BreadcrumbsProps>;

const Template: Story = {
    render: (args) => {
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
    },
};

export const Standard: Story = { ...Template };
