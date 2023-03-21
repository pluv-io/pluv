import type { AnchorProps } from "@pluv-internal/react-components";
import { Anchor } from "@pluv-internal/react-components";
import type { Meta, Story } from "@storybook/react";

export default {
    title: "react-components/atoms/Anchor",
    component: Anchor,
} as Meta;

const Template: Story<AnchorProps> = (args) => {
    return <Anchor {...args} />;
};
Template.args = {
    children: "google",
    href: "https://google.com",
};

export const Standard = Template.bind({});
Standard.args = { ...Template.args };
