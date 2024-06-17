import { Badge } from "@pluv-internal/react-components/either";
import type { Meta, StoryObj } from "@storybook/react";

const meta: Meta<typeof Badge> = {
    title: "components/either/atoms/Badge",
    component: Badge,
};

export default meta;

type Story = StoryObj<typeof Badge>;

export const Basic: Story = {
    render: (args) => {
        return <Badge>Badge</Badge>;
    },
};
