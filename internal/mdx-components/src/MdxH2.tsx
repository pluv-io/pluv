import { CSSProperties, FC, ReactNode } from "react";
import tw from "twin.macro";
import { MdxHeader } from "./MdxHeader";

const Root = tw(MdxHeader)`
    text-xl
    font-bold
`;

export interface MdxH2Props {
    children?: ReactNode;
    className?: string;
    style?: CSSProperties;
}

export const MdxH2: FC<MdxH2Props> = ({ children, className, style }) => {
    return (
        <Root className={className} style={style} type="h2">
            {children}
        </Root>
    );
};
