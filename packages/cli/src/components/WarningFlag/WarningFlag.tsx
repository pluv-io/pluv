import { Text } from "ink";
import React, { FC } from "react";

export interface WarningFlagProps {
    children?: string;
}

export const WarningFlag: FC<WarningFlagProps> = ({ children }) => {
    return (
        <Text backgroundColor="#fde047" bold>
            {" WARN "}
        </Text>
    );
};
