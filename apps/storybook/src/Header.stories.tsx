import type { Meta, Story } from "@storybook/react";
import { Header } from "./Header";

export default {
    title: "Example/Header",
    component: Header,
} as Meta;

const Template: Story = (args: any) => <Header {...args} />;

export const LoggedIn = Template.bind({});
LoggedIn.args = {
    user: {
        name: "Jane Doe",
    },
};

export const LoggedOut = Template.bind({});
LoggedOut.args = {};
