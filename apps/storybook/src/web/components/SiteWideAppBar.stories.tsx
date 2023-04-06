import type { Meta, StoryObj } from "@storybook/react";
import type { SiteWideAppBarProps } from "@pluv-apps/web/components";
import { SiteWideAppBar } from "@pluv-apps/web/components";

export default {
    title: "web/components/SiteWideAppBar",
    component: SiteWideAppBar,
} as Meta;

type Story = StoryObj<SiteWideAppBarProps>;

const Template: Story = {
    render: (args) => {
        return <SiteWideAppBar {...args} />;
    },
    parameters: {
        layout: "fullscreen",
    },
};

export const Standard: Story = { ...Template };
