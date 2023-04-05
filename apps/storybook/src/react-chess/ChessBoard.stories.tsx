import type { Meta, StoryObj } from "@storybook/react";
import type { ChessBoardProps } from "@pluv-internal/react-chess";
import { ChessBoard } from "@pluv-internal/react-chess";

export default {
    title: "react-chess/ChessBoard",
    component: ChessBoard,
} as Meta;

type Story = StoryObj<ChessBoardProps>;

const Template: Story = {
    render: (args) => {
        return <ChessBoard {...args} style={{ width: 600 }} />;
    },
};

export const Standard: Story = { ...Template };
