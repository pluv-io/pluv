import type { Meta, Story } from "@storybook/react";
import { within, userEvent } from "@storybook/testing-library";
import { Page } from "./Page";

export default {
    title: "Example/Page",
    component: Page,
} as Meta;

const Template: Story = (args: any) => <Page {...args} />;

// More on interaction testing: https://storybook.js.org/docs/react/writing-tests/interaction-testing
export const LoggedOut = Template.bind({});

export const LoggedIn = Template.bind({});
LoggedIn.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const loginButton = await canvas.getByRole("button", { name: /Log in/i });
    await userEvent.click(loginButton);
};
