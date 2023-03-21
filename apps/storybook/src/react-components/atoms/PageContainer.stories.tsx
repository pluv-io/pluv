import type { PageContainerProps } from "@pluv-internal/react-components";
import { PageContainer } from "@pluv-internal/react-components";
import type { Meta, Story } from "@storybook/react";

export default {
    title: "react-components/atoms/PageContainer",
    component: PageContainer,
} as Meta;

const Template: Story<PageContainerProps> = (args) => {
    return (
        <PageContainer {...args}>
            <div
                style={{
                    height: 64,
                    width: "100%",
                    backgroundColor: "red",
                }}
            />
        </PageContainer>
    );
};
Template.args = {};

export const Standard = Template.bind({});
Standard.args = { ...Template.args };
