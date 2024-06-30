import { Footer } from "@pluv-internal/react-components/either";
import type { Meta, StoryObj } from "@storybook/react";

const meta: Meta<typeof Footer> = {
    title: "components/either/atoms/Footer",
    component: Footer,
};

export default meta;

type Story = StoryObj<typeof Footer>;

const Template: Story = {
    render: (args) => {
        return <Footer {...args} />;
    },
    parameters: {
        layout: "fullscreen",
    },
};

export const Standard = { ...Template };
