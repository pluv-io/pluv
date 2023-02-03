import type { Meta, Story } from "@storybook/react";
import type { HomeChessDemoProps } from "@pluv-apps/web/components";
import { HomeChessDemo } from "@pluv-apps/web/components";
import { MockedRoomProvider } from "@pluv-apps/web/pluv-io";

export default {
    title: "web/HomeChessDemo",
    component: HomeChessDemo,
    decorators: [
        (Nested) => (
            <MockedRoomProvider room="story-home-chess-demo">
                <Nested />
            </MockedRoomProvider>
        ),
    ],
} as Meta;

const Template: Story<HomeChessDemoProps> = (args) => {
    return <HomeChessDemo {...args} />;
};
Template.args = {};

export const Standard = Template.bind({});
Standard.args = { ...Template.args };
