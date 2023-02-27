import { useDraggable } from "@dnd-kit/core";
import type { CSSProperties, FC } from "react";
import tw from "twin.macro";
import { BOX_SIZE } from "./constants";

const Root = tw.div`
    relative
    flex
    items-center
    justify-center
`;

const Box = tw.div`
    absolute
    rounded-lg
    cursor-grab
    [background-color: currentColor]
`;

const Selection = tw.div`
    absolute
    -inset-1
    border-2
    border-solid
    rounded-xl
    [border-color: currentColor]
`;

export interface HomeCodeDemoBoxProps {
    className?: string;
    id: string;
    position: { x: number; y: number };
    style?: CSSProperties;
}

export const HomeCodeDemoBox: FC<HomeCodeDemoBoxProps> = ({
    className,
    id,
    position: { x, y },
    style,
}) => {
    const { attributes, listeners, setNodeRef } = useDraggable({ id });

    return (
        <Root className={className} style={style}>
            <Box
                ref={setNodeRef}
                {...attributes}
                {...listeners}
                role="none"
                style={{
                    height: BOX_SIZE,
                    width: BOX_SIZE,
                    transform: `translate3d(${x}px, ${y}px, 0)`,
                }}
            >
                <Selection />
            </Box>
        </Root>
    );
};
