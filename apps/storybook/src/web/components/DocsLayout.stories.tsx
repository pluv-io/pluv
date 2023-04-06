import { faker } from "@faker-js/faker";
import {
    DocsLayout,
    DocsLayoutProps,
    SiteWideLayout,
} from "@pluv-apps/web/components";
import type { Meta, StoryObj } from "@storybook/react";
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

type Story = StoryObj<DocsLayoutProps>;

const Template: Story = {
    render: (args) => {
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
                                    <h3
                                        id={`heading-1a-${node.id}-${child.id}`}
                                    >
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
    },
    parameters: {
        layout: "fullscreen",
        nextRouter: {
            pathname: "/docs/io/basic-setup",
        },
    },
};

export const Standard: Story = { ...Template };
