import type { Meta, Story } from "@storybook/react";
import type { HomeChessDemoProps } from "@pluv-apps/web/components";
import { HomeChessDemo } from "@pluv-apps/web/components";
import { MockedRoomProvider } from "@pluv-apps/web/pluv-io";
import { y } from "@pluv/react";

export default {
    title: "web/HomeChessDemo",
    component: HomeChessDemo,
    decorators: [
        (Nested) => (
            <MockedRoomProvider
                initialStorage={() => ({
                    demo: y.unstable__object({
                        chessHistory: y.array<string>([]),
                    }),
                })}
                room="story-home-chess-demo"
            >
                <Nested />
            </MockedRoomProvider>
        ),
    ],
} as Meta;

const Template: Story<HomeChessDemoProps> = (args) => {
    return (
        <div style={{ width: 500 }}>
            <HomeChessDemo {...args} />
        </div>
    );
};
Template.args = {};

export const Standard = Template.bind({});
Standard.args = { ...Template.args };
