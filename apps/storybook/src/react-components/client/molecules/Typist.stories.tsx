import { Typist } from "@pluv-internal/react-components/client";
import type { Meta, StoryObj } from "@storybook/react";
import ms from "ms";

const meta: Meta<typeof Typist> = {
    title: "components/client/molecules/Typist",
    component: Typist,
};

export default meta;

type Story = StoryObj<typeof Typist>;

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
