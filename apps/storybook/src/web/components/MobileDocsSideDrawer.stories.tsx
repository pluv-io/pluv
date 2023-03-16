import type { Meta, Story } from "@storybook/react";
import type { MobileDocsSideDrawerProps } from "@pluv-apps/web/components";
import { MobileDocsSideDrawer } from "@pluv-apps/web/components";
import { SideDrawer } from "@pluv-internal/react-components";

export default {
    title: "web/components/MobileDocsSideDrawer",
    component: MobileDocsSideDrawer,
} as Meta;

const Template: Story<MobileDocsSideDrawerProps> = (args) => {
    return (
        <SideDrawer.Root>
            <SideDrawer.Trigger>
                <button>Open</button>
            </SideDrawer.Trigger>
            <MobileDocsSideDrawer {...args} />
        </SideDrawer.Root>
    );
};
Template.args = {};

export const Standard = Template.bind({});
Standard.args = { ...Template.args };
