import type { Meta, StoryObj } from "@storybook/react";
import type { DocsTreeViewNavigationProps } from "@pluv-apps/web/components";
import { DocsTreeViewNavigation } from "@pluv-apps/web/components";

export default {
    title: "web/components/DocsTreeViewNavigation",
    component: DocsTreeViewNavigation,
} as Meta;

type Story = StoryObj<DocsTreeViewNavigationProps>;

const Template: Story = {
    render: (args) => {
        return <DocsTreeViewNavigation {...args} />;
    },
};

export const Standard: Story = { ...Template };
