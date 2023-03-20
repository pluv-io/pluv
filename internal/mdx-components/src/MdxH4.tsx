import { CSSProperties, FC, ReactNode } from "react";
import tw from "twin.macro";
import { MdxHeader } from "./MdxHeader";

const Root = tw(MdxHeader)`
    text-lg
    font-semibold
`;

export interface MdxH4Props {
    children?: ReactNode;
    className?: string;
    style?: CSSProperties;
}

export const MdxH4: FC<MdxH4Props> = ({ children, className, style }) => {
    return (
        <Root className={className} style={style} type="h4">
            {children}
        </Root>
    );
};
