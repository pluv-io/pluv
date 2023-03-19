import type { Meta, Story } from "@storybook/react";
import { DocsLayout, DocsLayoutProps } from "@pluv-apps/web/components";
import { SiteWideLayout } from "@pluv-apps/web/components";
import { faker } from "@faker-js/faker";
import { Fragment } from "react";

faker.seed(1);

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

const getParagraphs = (max: number): string => {
    return faker.lorem.paragraphs(faker.datatype.number({ min: 0, max }));
};

interface TocNode {
    id: string;
    children: TocNode[];
}

const nodes: TocNode = {
    id: "1a",
    children: [
        {
            id: "2a",
            children: [
                { id: "3a", children: [] },
                { id: "3b", children: [] },
            ],
        },
        { id: "2b", children: [{ id: "3a", children: [] }] },
        {
            id: "2c",
            children: [
                { id: "3a", children: [] },
                { id: "3b", children: [] },
            ],
        },
    ],
};

const Template: Story<DocsLayoutProps> = (args) => {
    return (
        <DocsLayout {...args}>
            <a href="#heading-1a">
                <h1 id="heading-1a">Heading 1a</h1>
            </a>
            <p>{getParagraphs(10)}</p>
            {nodes.children.map((node) => (
                <Fragment key={node.id}>
                    <a href={`#heading-1a-${node.id}`}>
                        <h2 id={`heading-1a-${node.id}`}>
                            Heading 1a-{node.id}
                        </h2>
                    </a>
                    <p>{getParagraphs(10)}</p>
                    {node.children.map((child) => (
                        <Fragment key={child.id}>
                            <a href={`#heading-1a-${node.id}-${child.id}`}>
                                <h3 id={`heading-1a-${node.id}-${child.id}`}>
                                    Heading 1a-{node.id}-{child.id}
                                </h3>
                            </a>
                            <p>{getParagraphs(10)}</p>
                        </Fragment>
                    ))}
                </Fragment>
            ))}
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