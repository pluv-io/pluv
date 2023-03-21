import type { DocsCardProps } from "@pluv-apps/web/components";
import { DocsCard } from "@pluv-apps/web/components";
import type { Meta, Story } from "@storybook/react";
import { oneLine } from "common-tags";

export default {
    title: "web/components/DocsCard",
    component: DocsCard,
} as Meta;

const Template: Story<DocsCardProps> = (args) => {
    return <DocsCard {...args} />;
};
Template.args = {
    description: oneLine`
        Google LLC is an American multinational technology company focusing on
        online advertising, search engine technology, cloud computing,
        computer software, quantum computing, e-commerce, artificial
        intelligence, and consumer electronics.
    `,
    href: "https://google.com",
    title: "Google",
};

export const Standard = Template.bind({});
Standard.args = { ...Template.args };
