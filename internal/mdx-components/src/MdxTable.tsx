import { CSSProperties, FC, ReactNode } from "react";
import tw, { styled } from "twin.macro";

const Root = tw.div`
    flex
    items-stretch
    w-full
    border
    border-solid
    border-indigo-500/40
    rounded-md
    overflow-hidden
`;

const Table = styled.table`
    ${tw`
        grow
        -m-[1px]
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

export interface MdxTableProps {
    children?: ReactNode;
    className?: string;
    style?: CSSProperties;
}

export const MdxTable: FC<MdxTableProps> = ({ children, className, style }) => {
    return (
        <Root className={className} style={style}>
            <Table>{children}</Table>
        </Root>
    );
};
