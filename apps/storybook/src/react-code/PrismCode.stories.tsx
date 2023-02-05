import type { Meta, Story } from "@storybook/react";
import type { PrismCodeProps } from "@pluv-internal/react-code";
import { PrismCode } from "@pluv-internal/react-code";
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

export default {
    title: "react-code/PrismCode",
    component: PrismCode,
} as Meta;

const Template: Story<PrismCodeProps> = (args) => {
    return <PrismCode {...args} />;
};
Template.args = {
    children: DEFAULT_CODE,
};

export const Standard = Template.bind({});
Standard.args = { ...Template.args };
