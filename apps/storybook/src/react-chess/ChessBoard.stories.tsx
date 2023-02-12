import type { Meta, Story } from "@storybook/react";
import type { ChessBoardProps } from "@pluv-internal/react-chess";
import { ChessBoard } from "@pluv-internal/react-chess";

export default {
    title: "react-chess/ChessBoard",
    component: ChessBoard,
} as Meta;

const Template: Story<ChessBoardProps> = (args) => {
    return <ChessBoard {...args} style={{ width: 600 }} />;
};
Template.args = {};

export const Standard = Template.bind({});
Standard.args = { ...Template.args };
