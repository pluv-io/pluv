import { faker } from "@faker-js/faker";
import type { Meta, Story } from "@storybook/react";
import type { PaperProps } from "@pluv-internal/react-components";
import { Paper } from "@pluv-internal/react-components";

faker.seed(1);

export default {
    title: "react-components/atoms/Paper",
    component: Paper,
} as Meta;

const Template: Story<PaperProps> = (args) => {
    return <Paper {...args}>{faker.lorem.paragraphs(10)}</Paper>;
};
Template.args = {};

export const Standard = Template.bind({});
Standard.args = { ...Template.args };

export const AsLink: Story<PaperProps> = (args) => {
    return (
        <Paper {...args} as="a" href="https://google.com">
            {faker.lorem.paragraphs(10)}
        </Paper>
    );
};
Template.args = {};
