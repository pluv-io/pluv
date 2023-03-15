import { CSSProperties, FC, ReactNode } from "react";
import tw from "twin.macro";
import { MdxHeader } from "./MdxHeader";

const Root = tw(MdxHeader)`
    text-xs
    font-semibold
`;

export interface MdxH6Props {
    children?: ReactNode;
    className?: string;
    style?: CSSProperties;
}

export const MdxH6: FC<MdxH6Props> = ({ children, className, style }) => {
    return (
        <Root className={className} style={style} type="h6">
            {children}
        </Root>
    );
};
