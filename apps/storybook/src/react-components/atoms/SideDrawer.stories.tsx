/* eslint-disable react-hooks/rules-of-hooks */
import type { SideDrawerProps } from "@pluv-internal/react-components";
import { SideDrawer } from "@pluv-internal/react-components";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";

export default {
    title: "react-components/atoms/SideDrawer",
    component: SideDrawer,
} as Meta;

type Story = StoryObj<SideDrawerProps>;

const Template: Story = {
    render: (args) => {
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
    },
};

export const Standard: Story = { ...Template };
