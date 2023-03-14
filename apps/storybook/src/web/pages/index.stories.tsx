import { SiteWideLayout } from "@pluv-apps/web/components";
import { MockedRoomProvider } from "@pluv-apps/web/pluv-io";
import { Page } from "@pluv-apps/web/src/pages";
import { y } from "@pluv/react";
import type { Meta, Story } from "@storybook/react";

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
                <SiteWideLayout>
                    <Nested />
                </SiteWideLayout>
            </MockedRoomProvider>
        ),
    ],
} as Meta;

const Template: Story<{}> = (args) => {
    return <Page {...args} />;
};
Template.args = {};
Template.parameters = {
    layout: "fullscreen",
};

export const Standard = Template.bind({});
Standard.args = { ...Template.args };
Standard.parameters = { ...Template.parameters };
