import { Banner } from "@pluv-internal/react-components/either";
import type { Meta, StoryObj } from "@storybook/react";

const meta: Meta<typeof Banner> = {
    title: "components/either/atoms/Banner",
    component: Banner,
};

export default meta;

type Story = StoryObj<typeof Banner>;

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
