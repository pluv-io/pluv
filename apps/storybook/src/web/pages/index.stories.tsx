import type { Meta, Story } from "@storybook/react";
import { Page } from "@pluv-apps/web/src/pages";
import { MockedRoomProvider } from "@pluv-apps/web/pluv-io";
import { y } from "@pluv/react";

export default {
    title: "web/pages",
    component: Page,
    decorators: [
        (Nested) => (
            <MockedRoomProvider
                initialStorage={() => ({
                    demo: y.unstable__object({
                        chessHistory: y.array<string>([]),
                    }),
                })}
                room="story-pages"
            >
                <Nested />
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
