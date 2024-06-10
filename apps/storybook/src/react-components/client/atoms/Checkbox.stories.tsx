import { Checkbox, Label } from "@pluv-internal/react-components/client";
import type { Meta, StoryObj } from "@storybook/react";

const meta: Meta<typeof Checkbox> = {
    title: "components/client/atoms/Checkbox",
    component: Checkbox,
};

export default meta;

type Story = StoryObj<typeof Checkbox>;

export const Basic: Story = {
    render: (args) => (
        <div className="flex items-center space-x-2">
            <Checkbox {...args} id="terms" />
            <Label htmlFor="terms">Accept terms and conditions</Label>
        </div>
    ),
};
