import type { SiteWideLayoutProps } from "@pluv-apps/web/components";
import { SiteWideLayout } from "@pluv-apps/web/components";
import type { Meta, StoryObj } from "@storybook/react";

export default {
    title: "web/components/SiteWideLayout",
    component: SiteWideLayout,
} as Meta;

type Story = StoryObj<SiteWideLayoutProps>;

const Template: Story = {
    render: (args) => {
        return (
            <SiteWideLayout {...args}>
                <SiteWideLayout.Content>{args.children}</SiteWideLayout.Content>
            </SiteWideLayout>
        );
    },
    parameters: {
        layout: "fullscreen",
    },
};

export const Standard: Story = { ...Template };
