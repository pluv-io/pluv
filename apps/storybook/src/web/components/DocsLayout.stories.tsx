import type { Meta, Story } from "@storybook/react";
import { DocsLayout, DocsLayoutProps } from "@pluv-apps/web/components";
import { SiteWideLayout } from "@pluv-apps/web/components";

export default {
    title: "web/components/DocsLayout",
    component: SiteWideLayout,
    decorators: [
        (Nested) => (
            <SiteWideLayout style={{ padding: 0 }}>
                <Nested />
            </SiteWideLayout>
        ),
    ],
} as Meta;

const Template: Story<DocsLayoutProps> = (args) => {
    return (
        <DocsLayout {...args}>
            <DocsLayout.Content>{args.children}</DocsLayout.Content>
        </DocsLayout>
    );
};
Template.args = {};
Template.parameters = {
    layout: "fullscreen",
};

export const Standard = Template.bind({});
Standard.args = { ...Template.args };
Standard.parameters = { ...Template.parameters };
