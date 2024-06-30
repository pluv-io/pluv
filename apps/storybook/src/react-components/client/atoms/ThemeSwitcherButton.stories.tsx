import { ThemeSwitcherButton } from "@pluv-internal/react-components/client";
import type { Meta, StoryObj } from "@storybook/react";

const meta: Meta<typeof ThemeSwitcherButton> = {
    title: "components/client/atoms/ThemeSwitcherButton",
    component: ThemeSwitcherButton,
};

export default meta;

type Story = StoryObj<typeof ThemeSwitcherButton>;

export const Basic: Story = {
    render: (args) => <ThemeSwitcherButton {...args} />,
};
