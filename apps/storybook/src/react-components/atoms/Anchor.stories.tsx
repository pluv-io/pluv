import type { AnchorProps } from "@pluv-internal/react-components";
import { Anchor } from "@pluv-internal/react-components";
import type { Meta, StoryObj } from "@storybook/react";

export default {
    title: "react-components/atoms/Anchor",
    component: Anchor,
} as Meta;

type Story = StoryObj<AnchorProps>;

const Template: Story = {
    render: (args) => {
        return <Anchor {...args} />;
    },
    args: {
        children: "google",
        href: "https://google.com",
    },
};

export const Standard = { ...Template };
