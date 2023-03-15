import { CSSProperties, FC, ReactNode } from "react";
import tw from "twin.macro";
import { MdxHeader } from "./MdxHeader";

const Root = tw(MdxHeader)`
    text-lg
    font-semibold
`;

export interface MdxH3Props {
    children?: ReactNode;
    className?: string;
    style?: CSSProperties;
}

export const MdxH3: FC<MdxH3Props> = ({ children, className, style }) => {
    return (
        <Root className={className} style={style} type="h3">
            {children}
        </Root>
    );
};
