import type { Meta, StoryObj } from "@storybook/react";
import type { SiteWideFooterProps } from "@pluv-apps/web/components";
import { SiteWideFooter } from "@pluv-apps/web/components";

export default {
    title: "web/components/SiteWideFooter",
    component: SiteWideFooter,
} as Meta;

type Story = StoryObj<SiteWideFooterProps>;

const Template: Story = {
    render: (args) => {
        return <SiteWideFooter {...args} />;
    },
    parameters: {
        layout: "fullscreen",
    },
};

export const Standard: Story = { ...Template };
