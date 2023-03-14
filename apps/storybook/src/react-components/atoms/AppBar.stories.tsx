import type { Meta, Story } from "@storybook/react";
import type { AppBarProps } from "@pluv-internal/react-components";
import { AppBar } from "@pluv-internal/react-components";

export default {
    title: "react-components/atoms/AppBar",
    component: AppBar,
} as Meta;

const Template: Story<AppBarProps> = (args) => {
    return <AppBar {...args} />;
};
Template.args = {};
Template.parameters = {
    layout: "fullscreen",
};

export const Standard = Template.bind({});
Standard.args = { ...Template.args };
Standard.parameters = { ...Template.parameters };
