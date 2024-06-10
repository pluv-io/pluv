import { LogoIcon } from "@pluv-internal/react-components/either";
import type { Meta, StoryObj } from "@storybook/react";

const meta: Meta<typeof LogoIcon> = {
    title: "components/either/atoms/LogoIcon",
    component: LogoIcon,
};

export default meta;

type Story = StoryObj<typeof LogoIcon>;

const Template: Story = {
    render: (args) => {
        return <LogoIcon {...args} />;
    },
};

export const Standard = { ...Template };
