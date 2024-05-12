import type { ChessBoardProps } from "@pluv-internal/react-chess";
import { ChessBoard } from "@pluv-internal/react-chess";
import type { Meta, StoryObj } from "@storybook/react";

const meta: Meta<typeof ChessBoard> = {
    title: "react-chess/ChessBoard",
    component: ChessBoard,
};

export default meta;

type Story = StoryObj<ChessBoardProps>;

const Template: Story = {
    render: (args) => {
        return <ChessBoard {...args} style={{ width: 600 }} />;
    },
};

export const Standard: Story = { ...Template };
