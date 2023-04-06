import type { PageContainerProps } from "@pluv-internal/react-components";
import { PageContainer } from "@pluv-internal/react-components";
import type { Meta, StoryObj } from "@storybook/react";

export default {
    title: "react-components/atoms/PageContainer",
    component: PageContainer,
} as Meta;

type Story = StoryObj<PageContainerProps>;

const Template: Story = {
    render: (args) => {
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
    },
};

export const Standard = { ...Template };
