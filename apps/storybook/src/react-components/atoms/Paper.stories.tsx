import { faker } from "@faker-js/faker";
import type { Meta, StoryObj } from "@storybook/react";
import type { PaperProps } from "@pluv-internal/react-components";
import { Paper } from "@pluv-internal/react-components";

faker.seed(1);

export default {
    title: "react-components/atoms/Paper",
    component: Paper,
} as Meta;

type Story = StoryObj<PaperProps>;

const Template: Story = {
    render: (args) => {
        return <Paper {...args}>{faker.lorem.paragraphs(10)}</Paper>;
    },
};

export const Standard: Story = { ...Template };

export const AsLink: Story = {
    render: (args) => {
        return (
            <Paper {...args} as="a" href="https://google.com">
                {faker.lorem.paragraphs(10)}
            </Paper>
        );
    },
};
