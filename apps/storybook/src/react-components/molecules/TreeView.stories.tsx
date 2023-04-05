import type { TreeViewProps } from "@pluv-internal/react-components";
import { TreeView } from "@pluv-internal/react-components";
import { action } from "@storybook/addon-actions";
import type { Meta, StoryObj } from "@storybook/react";

export default {
    title: "react-components/molecules/TreeView",
    component: TreeView,
} as Meta;

type Story = StoryObj<TreeViewProps>;

const Template: Story = {
    render: (args) => {
        return (
            <TreeView {...args}>
                <TreeView.Link href="https://google.com">Google</TreeView.Link>
                <TreeView.Link href="https://reddit.com">Reddit</TreeView.Link>
                <TreeView.Button onClick={action("onClick")}>
                    Login
                </TreeView.Button>
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
