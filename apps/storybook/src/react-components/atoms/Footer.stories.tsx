import type { Meta, Story } from "@storybook/react";
import type { FooterProps } from "@pluv-internal/react-components";
import { Footer } from "@pluv-internal/react-components";

export default {
    title: "react-components/atoms/Footer",
    component: Footer,
} as Meta;

const Template: Story<FooterProps> = (args) => {
    return <Footer {...args} />;
};
Template.args = {};
Template.parameters = {
    layout: "fullscreen",
};

export const Standard = Template.bind({});
Standard.args = { ...Template.args };
Standard.parameters = { ...Template.parameters };
