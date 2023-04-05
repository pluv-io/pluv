import type { Meta, StoryObj } from "@storybook/react";
import type { TypistProps } from "@pluv-internal/react-components";
import { Typist } from "@pluv-internal/react-components";
import ms from "ms";

export default {
    title: "react-components/molecules/Typist",
    component: Typist,
} as Meta;

type Story = StoryObj<TypistProps>;

const Template: Story = {
    render: (args) => {
        return (
            <Typist {...args}>
                <Typist.Cursor />
            </Typist>
        );
    },
    args: {
        deleteSpeed: ms("25ms"),
        repeatDelay: ms("5s"),
        sentences: ["Cloudflare Workers", "Node", "React"],
    },
};

export const Standard: Story = { ...Template };
