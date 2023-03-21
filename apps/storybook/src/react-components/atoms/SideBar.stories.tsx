import type { SideBarProps } from "@pluv-internal/react-components";
import { SideBar } from "@pluv-internal/react-components";
import type { Meta, Story } from "@storybook/react";

export default {
    title: "react-components/atoms/SideBar",
    component: SideBar,
} as Meta;

const Template: Story<SideBarProps> = (args) => {
    return <SideBar {...args} style={{ height: "100vh" }} />;
};
Template.args = {};
Template.parameters = {
    layout: "fullscreen",
};

export const Standard = Template.bind({});
Standard.args = { ...Template.args };
Standard.parameters = { ...Template.parameters };
