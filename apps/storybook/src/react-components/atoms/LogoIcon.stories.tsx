import type { LogoIconProps } from "@pluv-internal/react-components";
import { LogoIcon } from "@pluv-internal/react-components";
import type { Meta, Story } from "@storybook/react";

export default {
    title: "react-components/atoms/LogoIcon",
    component: LogoIcon,
} as Meta;

const Template: Story<LogoIconProps> = (args) => {
    return <LogoIcon {...args} />;
};
Template.args = {};

export const Standard = Template.bind({});
Standard.args = { ...Template.args };
