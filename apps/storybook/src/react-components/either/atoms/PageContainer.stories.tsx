import { PageContainer } from "@pluv-internal/react-components/either";
import type { Meta, StoryObj } from "@storybook/react";

const meta: Meta<typeof PageContainer> = {
    title: "components/either/atoms/PageContainer",
    component: PageContainer,
};

export default meta;

type Story = StoryObj<typeof PageContainer>;

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
