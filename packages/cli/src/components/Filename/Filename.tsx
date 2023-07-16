import { Text } from "ink";
import React, { FC } from "react";

export interface FilenameProps {
    children?: string;
}

export const Filename: FC<FilenameProps> = ({ children }) => {
    return (
        <Text bold color="#22d3ee">
            {children}
        </Text>
    );
};
