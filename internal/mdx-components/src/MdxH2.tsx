import { CSSProperties, ReactElement, ReactNode } from "react";
import tw from "twin.macro";
import { MdxHeader } from "./MdxHeader";

const Root = tw(MdxHeader)`
    text-3xl
    font-bold
`;

export interface MdxH2Props {
    children?: ReactNode;
    className?: string;
    style?: CSSProperties;
}

export const MdxH2 = ({ children, className, style }: MdxH2Props): ReactElement | null => {
    return (
        <Root className={className} style={style} type="h2">
            {children}
        </Root>
    );
};
