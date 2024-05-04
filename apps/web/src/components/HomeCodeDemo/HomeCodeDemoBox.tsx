import { useDraggable } from "@dnd-kit/core";
import composeRefs from "@seznam/compose-react-refs";
import type { CSSProperties } from "react";
import { forwardRef } from "react";
import tw, { styled, theme } from "twin.macro";
import { BOX_SIZE, MOBILE_BOX_SIZE } from "./constants";

const Root = tw.div`
    relative
    flex
    items-center
    justify-center
`;

const Box = styled.div`
    ${tw`
        absolute
        rounded-lg
        cursor-grab
        [background-color: currentColor]
        [&[data-selected="true"]]:cursor-grabbing
    `}

    height: ${MOBILE_BOX_SIZE}px;
    width: ${MOBILE_BOX_SIZE}px;

    @media (min-width: ${theme`screens.md`}) {
        height: ${BOX_SIZE}px;
        width: ${BOX_SIZE}px;
    }
`;

const User = tw.div`
    absolute
    -top-8
    left-1/2
    -translate-x-1/2
    px-1.5
    pointer-events-none
`;

const UserName = tw.span`
    text-sm
    font-semibold
`;

const UserBackground = tw.div`
    absolute
    inset-0
    rounded-md
    [background-color: currentColor]
    opacity-20
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
    onSelect?: () => void;
    position: { x: number; y: number };
    selected?: boolean;
    style?: CSSProperties;
    user?: string | null;
}

export const HomeCodeDemoBox = forwardRef<HTMLDivElement, HomeCodeDemoBoxProps>((props, ref) => {
    const {
        className,
        id,
        onSelect,
        position: { x, y },
        selected,
        style,
        user,
    } = props;

    const { attributes, isDragging, listeners, setNodeRef } = useDraggable({
        id,
    });

    return (
        <Root className={className} style={style}>
            <Box
                ref={composeRefs<HTMLDivElement>(ref, setNodeRef)}
                {...attributes}
                {...listeners}
                onMouseDown={() => {
                    onSelect?.();
                }}
                role="none"
                style={{
                    transform: `translate3d(${x}px, ${y}px, 0)`,
                }}
                data-selected={isDragging}
            >
                {!!user && (
                    <User>
                        <UserName>{user}</UserName>
                        <UserBackground />
                    </User>
                )}
                {selected && <Selection />}
            </Box>
        </Root>
    );
});

HomeCodeDemoBox.displayName = "HomeCodeDemoBox";
