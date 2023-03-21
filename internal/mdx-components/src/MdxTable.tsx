import { InferComponentProps } from "@pluv-internal/typings";
import { FC } from "react";
import tw, { styled } from "twin.macro";

const Root = styled.table`
    ${tw`
        w-full
    `}

    & thead, & tbody, & tr {
        ${tw`
            border-indigo-500/40
        `}
    }

    & thead tr {
        ${tw`
            border-b-2
            border-b-indigo-500
        `}
    }

    & td,
    & th {
        ${tw`
            border
            p-2
            [border-color: inherit]
        `}
    }

    & thead,
    & tr:nth-child(2n) {
        ${tw`
            bg-zinc-800
        `}
    }
`;

export type MdxTableProps = Omit<InferComponentProps<"table">, "ref">;

export const MdxTable: FC<MdxTableProps> = (props) => {
    return <Root {...props} />;
};
