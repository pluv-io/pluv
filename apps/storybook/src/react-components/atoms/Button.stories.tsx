import type { Meta, Story } from "@storybook/react";
import type { ButtonProps } from "@pluv-internal/react-components";
import { Button } from "@pluv-internal/react-components";

export default {
    title: "react-components/atoms/Button",
    component: Button,
} as Meta;

const Template: Story<ButtonProps> = (args) => {
    return <Button {...args} />;
};
Template.args = {
    children: "Button",
    variant: "primary",
};

export const Standard = Template.bind({});
Standard.args = { ...Template.args };
