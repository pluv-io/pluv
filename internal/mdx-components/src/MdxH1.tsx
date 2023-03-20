import { CSSProperties, FC, ReactNode } from "react";
import tw from "twin.macro";
import { MdxHeader } from "./MdxHeader";

const Root = tw(MdxHeader)`
    text-5xl
    font-bold
`;

export interface MdxH1Props {
    children?: ReactNode;
    className?: string;
    style?: CSSProperties;
}

export const MdxH1: FC<MdxH1Props> = ({ children, className, style }) => {
    return (
        <Root className={className} style={style} type="h1">
            {children}
        </Root>
    );
};
