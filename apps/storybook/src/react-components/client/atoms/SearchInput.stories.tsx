import { SearchInput } from "@pluv-internal/react-components/client";
import type { Meta, StoryObj } from "@storybook/react";

const meta: Meta<typeof SearchInput> = {
    title: "components/client/atoms/SearchInput",
    component: SearchInput,
};

export default meta;

type Story = StoryObj<typeof SearchInput>;

export const Basic: Story = {
    render: (args) => <SearchInput {...args} />,
    args: {
        placeholder: "Search Team...",
    },
};
