import type { DocsCardProps } from "@pluv-apps/web/components";
import { DocsCard } from "@pluv-apps/web/components";
import type { Meta, StoryObj } from "@storybook/react";
import { oneLine } from "common-tags";

export default {
    title: "web/components/DocsCard",
    component: DocsCard,
} as Meta;

type Story = StoryObj<DocsCardProps>;

const Template: Story = {
    render: (args) => {
        return <DocsCard {...args} />;
    },
    args: {
        description: oneLine`
            Google LLC is an American multinational technology company focusing on
            online advertising, search engine technology, cloud computing,
            computer software, quantum computing, e-commerce, artificial
            intelligence, and consumer electronics.
        `,
        href: "https://google.com",
        title: "Google",
    },
};

export const Standard: Story = { ...Template };
