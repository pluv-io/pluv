import type { ButtonProps } from "@pluv-internal/react-components";
import { Button } from "@pluv-internal/react-components";
import type { Meta, StoryObj } from "@storybook/react";

export default {
    title: "react-components/atoms/Button",
    component: Button,
} as Meta;

type Story = StoryObj<ButtonProps>;

const Template: Story = {
    render: (args) => {
        return <Button {...args} />;
    },
    args: {
        children: "Button",
        variant: "primary",
    },
};

export const Standard = { ...Template.args };
