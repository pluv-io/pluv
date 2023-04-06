import type { MobileDocsSideDrawerProps } from "@pluv-apps/web/components";
import { MobileDocsSideDrawer } from "@pluv-apps/web/components";
import { SideDrawer } from "@pluv-internal/react-components";
import type { Meta, StoryObj } from "@storybook/react";

export default {
    title: "web/components/MobileDocsSideDrawer",
    component: MobileDocsSideDrawer,
} as Meta;

type Story = StoryObj<MobileDocsSideDrawerProps>;

const Template: Story = {
    render: (args) => {
        return (
            <SideDrawer.Root>
                <SideDrawer.Trigger>
                    <button>Open</button>
                </SideDrawer.Trigger>
                <MobileDocsSideDrawer {...args} />
            </SideDrawer.Root>
        );
    },
};

export const Standard: Story = { ...Template };
