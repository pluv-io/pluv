import type { SideDrawerProps } from "@pluv-internal/react-components";
import { SideDrawer } from "@pluv-internal/react-components";
import type { Meta, Story } from "@storybook/react";
import { useState } from "react";

export default {
    title: "react-components/atoms/SideDrawer",
    component: SideDrawer,
} as Meta;

const Template: Story<SideDrawerProps> = (args) => {
    const [open, setOpen] = useState<boolean>(true);

    return (
        <SideDrawer.Root
            onOpenChange={(newOpen) => {
                setOpen(newOpen);
            }}
            open={open}
        >
            <SideDrawer.Trigger>
                <button type="button">Open</button>
            </SideDrawer.Trigger>
            <SideDrawer {...args} />
        </SideDrawer.Root>
    );
};
Template.args = {};

export const Standard = Template.bind({});
Standard.args = { ...Template.args };
