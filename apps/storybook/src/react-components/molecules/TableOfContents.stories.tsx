import { faker } from "@faker-js/faker";
import type { TableOfContentsProps } from "@pluv-internal/react-components";
import { TableOfContents } from "@pluv-internal/react-components";
import type { Meta, StoryObj } from "@storybook/react";
import { Fragment } from "react";

faker.seed(1);

export default {
    title: "react-components/molecules/TableOfContents",
    component: TableOfContents,
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

type Story = StoryObj<TableOfContentsProps>;

const Template: Story = {
    render: (args) => {
        return (
            <div
                style={{
                    display: "flex",
                    flexDirection: "row",
                    gap: "2rem",
                    height: "100vh",
                }}
            >
                <div
                    id="table-of-contents-content"
                    style={{
                        flexBasis: 0,
                        flexGrow: 1,
                        flexShrink: 0,
                        overflowY: "auto",
                    }}
                >
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
                                    <a
                                        href={`#heading-1a-${node.id}-${child.id}`}
                                    >
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
                </div>
                <TableOfContents
                    {...args}
                    selector="#table-of-contents-content"
                    style={{
                        position: "sticky",
                        top: 0,
                        flexBasis: 0,
                        flexGrow: 1,
                        flexShrink: 0,
                    }}
                />
            </div>
        );
    },
};

export const Standard: Story = { ...Template };
