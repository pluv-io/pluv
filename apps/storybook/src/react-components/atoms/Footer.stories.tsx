import type { FooterProps } from "@pluv-internal/react-components";
import { Footer } from "@pluv-internal/react-components";
import type { Meta, StoryObj } from "@storybook/react";

export default {
    title: "react-components/atoms/Footer",
    component: Footer,
} as Meta;

type Story = StoryObj<FooterProps>;

const Template: Story = {
    render: (args) => {
        return <Footer {...args} />;
    },
    parameters: {
        layout: "fullscreen",
    },
};

export const Standard = { ...Template };
