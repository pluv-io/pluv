import { Breadcrumbs } from "@pluv-internal/react-components/client";
import type { Meta, StoryObj } from "@storybook/react";

const meta: Meta<typeof Breadcrumbs> = {
    title: "components/client/molecules/Breadcrumbs",
    component: Breadcrumbs,
};

export default meta;

type Story = StoryObj<typeof Breadcrumbs>;

const Template: Story = {
    render: (args) => {
        return (
            <Breadcrumbs {...args}>
                <Breadcrumbs.Item href="https://google.com">Google</Breadcrumbs.Item>
                <Breadcrumbs.Item href="https://google.com">Google</Breadcrumbs.Item>
                <Breadcrumbs.Item href="https://google.com">Google</Breadcrumbs.Item>
            </Breadcrumbs>
        );
    },
};

export const Standard: Story = { ...Template };
