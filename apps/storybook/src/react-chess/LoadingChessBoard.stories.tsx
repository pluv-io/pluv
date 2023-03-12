import type { Meta, Story } from "@storybook/react";
import type { LoadingChessBoardProps } from "@pluv-internal/react-chess";
import { LoadingChessBoard } from "@pluv-internal/react-chess";

export default {
    title: "react-chess/LoadingChessBoard",
    component: LoadingChessBoard,
} as Meta;

const Template: Story<LoadingChessBoardProps> = (args) => {
    return <LoadingChessBoard {...args} style={{ width: 600 }} />;
};
Template.args = {};

export const Standard = Template.bind({});
Standard.args = { ...Template.args };
