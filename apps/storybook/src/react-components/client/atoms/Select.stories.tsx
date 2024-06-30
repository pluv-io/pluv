import { Select } from "@pluv-internal/react-components/client";
import type { Meta, StoryObj } from "@storybook/react";

const meta: Meta<typeof Select> = {
    title: "components/client/atoms/Select",
    component: Select,
};

export default meta;

type Story = StoryObj<typeof Select>;

export const Basic: Story = {
    render: (args) => (
        <Select>
            <Select.Trigger className="w-[180px]">
                <Select.Value placeholder="Select a fruit" />
            </Select.Trigger>
            <Select.Content>
                <Select.Group>
                    <Select.Label>Fruits</Select.Label>
                    <Select.Item value="apple">Apple</Select.Item>
                    <Select.Item value="banana">Banana</Select.Item>
                    <Select.Item value="blueberry">Blueberry</Select.Item>
                    <Select.Item value="grapes">Grapes</Select.Item>
                    <Select.Item value="pineapple">Pineapple</Select.Item>
                </Select.Group>
            </Select.Content>
        </Select>
    ),
};
