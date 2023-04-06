import type { PillProps } from "@pluv-internal/react-components";
import { Pill } from "@pluv-internal/react-components";
import type { Meta, StoryObj } from "@storybook/react";

export default {
    title: "react-components/atoms/Pill",
    component: Pill,
} as Meta;

type Story = StoryObj<PillProps>;

const Template: Story = {
    render: (args) => {
        return <Pill {...args} />;
    },
    args: {
        children: "pluv.io",
    },
};

export const Standard = { ...Template };
