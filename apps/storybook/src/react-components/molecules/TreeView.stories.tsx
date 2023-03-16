import { action } from "@storybook/addon-actions";
import type { Meta, Story } from "@storybook/react";
import type { TreeViewProps } from "@pluv-internal/react-components";
import { TreeView } from "@pluv-internal/react-components";
import { TreeViewList } from "@pluv-internal/react-components/src/molecules/TreeView/TreeViewList";

export default {
    title: "react-components/molecules/TreeView",
    component: TreeView,
} as Meta;

const Template: Story<TreeViewProps> = (args) => {
    return (
        <TreeView {...args}>
            <TreeView.Link href="https://google.com">Google</TreeView.Link>
            <TreeView.Link href="https://reddit.com">Reddit</TreeView.Link>
            <TreeView.Button onClick={action("onClick")}>Login</TreeView.Button>
            <TreeViewList
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
            </TreeViewList>
            <TreeViewList
                content={
                    <>
                        <TreeView.Button>Purple</TreeView.Button>
                        <TreeView.Button>Green</TreeView.Button>
                        <TreeView.Button>Orange</TreeView.Button>
                    </>
                }
            >
                Secondary Colors
            </TreeViewList>
        </TreeView>
    );
};
Template.args = {};

export const Standard = Template.bind({});
Standard.args = { ...Template.args };
