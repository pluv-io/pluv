import type { BannerProps } from "@pluv-internal/react-components";
import { Banner } from "@pluv-internal/react-components";
import type { Meta, StoryObj } from "@storybook/react";

export default {
    title: "react-components/atoms/Banner",
    component: Banner,
} as Meta;

type Story = StoryObj<BannerProps>;

const Template: Story = {
    render: (args) => {
        return (
            <Banner {...args}>
                <div>Hello world~!</div>
            </Banner>
        );
    },
    parameters: {
        layout: "fullscreen",
    },
};

export const Standard = { ...Template };
