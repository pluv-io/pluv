import type { LogoIconProps } from "@pluv-internal/react-components";
import { LogoIcon } from "@pluv-internal/react-components";
import type { Meta, StoryObj } from "@storybook/react";

export default {
    title: "react-components/atoms/LogoIcon",
    component: LogoIcon,
} as Meta;

type Story = StoryObj<LogoIconProps>;

const Template: Story = {
    render: (args) => {
        return <LogoIcon {...args} />;
    },
};

export const Standard = { ...Template };
