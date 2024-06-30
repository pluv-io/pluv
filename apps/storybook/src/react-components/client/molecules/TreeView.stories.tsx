import { TreeView } from "@pluv-internal/react-components/client";
import type { Meta, StoryObj } from "@storybook/react";

const meta: Meta<typeof TreeView> = {
    title: "components/client/molecules/TreeView",
    component: TreeView,
};

export default meta;

type Story = StoryObj<typeof TreeView>;

const Template: Story = {
    render: (args) => {
        return (
            <TreeView {...args}>
                <TreeView.Link href="https://google.com">Google</TreeView.Link>
                <TreeView.Link href="https://reddit.com">Reddit</TreeView.Link>
                <TreeView.Button>Login</TreeView.Button>
                <TreeView.List
                    href="https://google.com"
                    content={
                        <>
                            <TreeView.Button>Red</TreeView.Button>
                            <TreeView.Button>Blue</TreeView.Button>
                            <TreeView.Button>Yellow</TreeView.Button>
                        </>
                    }
                >
                    Primary Colors
                </TreeView.List>
                <TreeView.List
                    content={
                        <>
                            <TreeView.Button>Purple</TreeView.Button>
                            <TreeView.Button>Green</TreeView.Button>
                            <TreeView.Button>Orange</TreeView.Button>
                        </>
                    }
                >
                    Secondary Colors
                </TreeView.List>
            </TreeView>
        );
    },
};

export const Standard: Story = { ...Template };
