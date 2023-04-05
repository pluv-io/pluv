import { SiteWideLayout } from "@pluv-apps/web/components";
import { MockedRoomProvider } from "@pluv-apps/web/pluv-io";
import { Page } from "@pluv-apps/web/src/pages";
import { y } from "@pluv/react";
import type { Meta, StoryObj } from "@storybook/react";

export default {
    title: "web/pages",
    component: Page,
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
                room="story-pages"
            >
                <SiteWideLayout style={{ padding: 0 }}>
                    <Nested />
                </SiteWideLayout>
            </MockedRoomProvider>
        ),
    ],
} as Meta;

type Story = StoryObj<{}>;

const Template: Story = {
    render: (args) => {
        return <Page {...args} />;
    },
    parameters: {
        layout: "fullscreen",
    },
};

export const Standard: Story = { ...Template };
