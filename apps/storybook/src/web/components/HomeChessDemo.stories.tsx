import type { Meta, StoryObj } from "@storybook/react";
import type { HomeChessDemoProps } from "@pluv-apps/web/components";
import { HomeChessDemo } from "@pluv-apps/web/components";
import { MockedRoomProvider } from "@pluv-apps/web/pluv-io";
import { y } from "@pluv/react";

export default {
    title: "web/components/HomeChessDemo",
    component: HomeChessDemo,
    decorators: [
        (Nested) => (
            <MockedRoomProvider
                initialPresence={{
                    demoChessSquare: null,
                }}
                initialStorage={() => ({
                    demo: y.object({
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

type Story = StoryObj<HomeChessDemoProps>;

const Template: Story = {
    render: (args) => {
        return <HomeChessDemo {...args} />;
    },
};

export const Standard: Story = { ...Template };
