import { Tooltip } from "@pluv-internal/react-components/client";
import { Button } from "@pluv-internal/react-components/either";
import type { Meta, StoryObj } from "@storybook/react";

const meta: Meta<typeof Tooltip> = {
    title: "components/client/atoms/Tooltip",
    component: Tooltip,
};

export default meta;

type Story = StoryObj<typeof Tooltip>;

export const Basic: Story = {
    render: (args) => (
        <Tooltip.Provider>
            <Tooltip>
                <Tooltip.Trigger asChild>
                    <Button>Hover</Button>
                </Tooltip.Trigger>
                <Tooltip.Content>
                    <p>Add to library</p>
                </Tooltip.Content>
            </Tooltip>
        </Tooltip.Provider>
    ),
};
