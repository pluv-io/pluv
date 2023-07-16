import { Text } from "ink";
import React, { FC } from "react";

export interface ErrorFlagProps {
    children?: string;
}

export const ErrorFlag: FC<ErrorFlagProps> = ({ children }) => {
    return (
        <Text backgroundColor="#ef4444" bold>
            {" ERROR "}
        </Text>
    );
};
