import type { Meta, StoryObj } from "@storybook/react";
import type { MultiPrismCodeProps } from "@pluv-internal/react-code";
import { MultiPrismCode } from "@pluv-internal/react-code";
import { codeBlock } from "common-tags";

const DEFAULT_CODE = codeBlock`
import React, { CSSProperties, FC, ReactNode } from "react";

export interface ButtonProps {
    children?: ReactNode;
    className?: string;
    style?: CSSProperties;
}

export const Button: FC<ButtonProps> = ({ children, className, style }) => {
    return (
        <Button className={className} style={style}>
            {children}
        </Button>
    );
};
`;

const TAB1 = `
// File1

${DEFAULT_CODE}
`.trim();

const TAB2 = `
// File2

${DEFAULT_CODE}
`.trim();

export default {
    title: "react-code/MultiPrismCode",
    component: MultiPrismCode,
} as Meta;

type Story = StoryObj<MultiPrismCodeProps<"File1" | "File2">>;

const Template: Story = {
    render: (args) => {
        return <MultiPrismCode {...args} />;
    },
    args: {
        tabs: [
            {
                code: TAB1,
                name: "File1",
            },
            {
                code: TAB2,
                name: "File2",
            },
        ],
    },
};

export const Standard: Story = { ...Template };
