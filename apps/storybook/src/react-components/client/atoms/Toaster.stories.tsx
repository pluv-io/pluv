import { Toaster, toast } from "@pluv-internal/react-components/client";
import type { Meta, StoryObj } from "@storybook/react";

const meta: Meta<typeof Toaster> = {
    title: "components/client/atoms/Toaster",
    component: Toaster,
};

export default meta;

type Story = StoryObj<typeof Toaster>;

export const Basic: Story = {
    render: (args) => (
        <>
            <button
                onClick={() => {
                    toast("This is a toast!");
                }}
                type="button"
            >
                Click me!
            </button>
            <Toaster {...args} />
        </>
    ),
};
