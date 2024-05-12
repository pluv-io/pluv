import type { Meta, StoryObj } from "@storybook/react";
import type { LoadingChessBoardProps } from "@pluv-internal/react-chess";
import { LoadingChessBoard } from "@pluv-internal/react-chess";

const meta: Meta<typeof LoadingChessBoard> = {
    title: "react-chess/LoadingChessBoard",
    component: LoadingChessBoard,
};

export default meta;

type Story = StoryObj<LoadingChessBoardProps>;

const Template: Story = {
    render: (args) => {
        return <LoadingChessBoard {...args} style={{ width: 600 }} />;
    },
};

export const Standard: Story = { ...Template };
