import type { Meta, Story } from "@storybook/react";
import type { TypistProps } from "@pluv-internal/react-components";
import { Typist } from "@pluv-internal/react-components";
import ms from "ms";

export default {
    title: "react-components/molecules/Typist",
    component: Typist,
} as Meta;

const Template: Story<TypistProps> = (args) => {
    return (
        <Typist {...args}>
            <Typist.Cursor />
        </Typist>
    );
};
Template.args = {
    deleteSpeed: ms("25ms"),
    repeatDelay: ms("5s"),
    sentences: ["Cloudflare Workers", "Node", "React"],
};

export const Standard = Template.bind({});
Standard.args = { ...Template.args };
