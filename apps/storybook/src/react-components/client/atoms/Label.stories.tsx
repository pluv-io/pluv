import { Checkbox, Label } from "@pluv-internal/react-components/client";
import type { Meta, StoryObj } from "@storybook/react";

const meta: Meta<typeof Label> = {
    title: "components/client/atoms/Label",
    component: Label,
};

export default meta;

type Story = StoryObj<typeof Label>;

export const Basic: Story = {
    render: (args) => (
        <div className="flex items-center space-x-2">
            <Checkbox id="terms" />
            <Label {...args} htmlFor="terms">
                Accept terms and conditions
            </Label>
        </div>
    ),
};
