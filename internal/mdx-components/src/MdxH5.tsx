import { CSSProperties, FC, ReactNode } from "react";
import tw from "twin.macro";
import { MdxHeader } from "./MdxHeader";

const Root = tw(MdxHeader)`
    text-base
    font-semibold
`;

export interface MdxH5Props {
    children?: ReactNode;
    className?: string;
    style?: CSSProperties;
}

export const MdxH5: FC<MdxH5Props> = ({ children, className, style }) => {
    return (
        <Root className={className} style={style} type="h5">
            {children}
        </Root>
    );
};
