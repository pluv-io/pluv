import { CSSProperties, ReactElement, ReactNode } from "react";
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

export const MdxH1 = ({
    children,
    className,
    style,
}: MdxH1Props): ReactElement | null => {
    return (
        <Root className={className} style={style} type="h1">
            {children}
        </Root>
    );
};
