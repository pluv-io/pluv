import { CSSProperties, ReactElement, ReactNode } from "react";
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

export const MdxH4 = ({
    children,
    className,
    style,
}: MdxH4Props): ReactElement | null => {
    return (
        <Root className={className} style={style} type="h4">
            {children}
        </Root>
    );
};
