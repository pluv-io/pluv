import { Avatar } from "@pluv-internal/react-components/client";
import type { Meta, StoryObj } from "@storybook/react";

const meta: Meta<typeof Avatar> = {
    title: "components/client/atoms/Avatar",
    component: Avatar,
};

export default meta;

type Story = StoryObj<typeof Avatar>;

export const Animal: Story = {
    render: (args) => (
        <Avatar>
            <Avatar.Animal data="leedavidcs" />
            <Avatar.Fallback />
        </Avatar>
    ),
};

export const Basic: Story = {
    render: (args) => (
        <Avatar>
            <Avatar.GitHubImage alt="leedavidcs" src="https://avatars.githubusercontent.com/u/15151154?v=4" />
            <Avatar.Fallback />
        </Avatar>
    ),
};
