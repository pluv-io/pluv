import { CSSProperties, ReactElement, ReactNode } from "react";
import tw from "twin.macro";
import { MdxHeader } from "./MdxHeader";

const Root = tw(MdxHeader)`
    text-2xl
    font-bold
`;

export interface MdxH3Props {
    children?: ReactNode;
    className?: string;
    style?: CSSProperties;
}

export const MdxH3 = ({ children, className, style }: MdxH3Props): ReactElement | null => {
    return (
        <Root className={className} style={style} type="h3">
            {children}
        </Root>
    );
};
