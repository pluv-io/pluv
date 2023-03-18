import type { Meta, Story } from "@storybook/react";
import type { PillProps } from "@pluv-internal/react-components";
import { Pill } from "@pluv-internal/react-components";

export default {
    title: "react-components/atoms/Pill",
    component: Pill,
} as Meta;

const Template: Story<PillProps> = (args) => {
    return <Pill {...args} />;
};
Template.args = {
    children: "pluv.io",
};

export const Standard = Template.bind({});
Standard.args = { ...Template.args };
