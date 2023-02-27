import { DndContext } from "@dnd-kit/core";
import { CSSProperties, FC, useCallback, useMemo, useState } from "react";
import { useContext } from "react";
import tw from "twin.macro";
import { BOX_SIZE } from "./constants";
import { HomeCodeDemoContext, HomeCodeDemoPosition } from "./context";
import { HomeCodeDemoBox } from "./HomeCodeDemoBox";

const Root = tw.div`
    relative
    flex
    items-center
    justify-center
    border
    border-solid
    border-indigo-500/40
    rounded-md
    overflow-hidden
`;

const MockButtons = tw.div`
    absolute
    top-5
    left-5
    flex
    flex-row
    items-center
    gap-1
    pointer-events-none
`;

const MockButton = tw.span`
    h-2
    w-2
    rounded-full
    bg-gray-500/20
`;

const FirstBox = tw(HomeCodeDemoBox)`
    text-cyan-500
`;

const SecondBox = tw(HomeCodeDemoBox)`
    text-indigo-600
`;

export interface HomeCodeDemoBrowserProps {
    className?: string;
    id: string;
    style?: CSSProperties;
}

export const HomeCodeDemoBrowser: FC<HomeCodeDemoBrowserProps> = ({
    className,
    id,
    style,
}) => {
    const { codePositions, initPositions, setCodePositions, setInitPositions } =
        useContext(HomeCodeDemoContext);

    const [rootElem, rootRef] = useState<HTMLDivElement | null>(null);

    const clampPosition = useCallback(
        (position: HomeCodeDemoPosition): HomeCodeDemoPosition => {
            const rootRect = rootElem?.getBoundingClientRect();

            if (!rootRect) return position;

            const minWidth = rootRect.width / -2 + BOX_SIZE / 2;
            const maxWidth = rootRect.width / 2 - BOX_SIZE / 2;
            const minHeight = rootRect.height / -2 + BOX_SIZE / 2;
            const maxHeight = rootRect.height / 2 - BOX_SIZE / 2;

            const newXPosition = Math.min(
                Math.max(position.x, minWidth),
                maxWidth
            );
            const newYPosition = Math.min(
                Math.max(position.y, minHeight),
                maxHeight
            );

            return { x: newXPosition, y: newYPosition };
        },
        [rootElem]
    );

    return (
        <Root ref={rootRef} className={className} style={style}>
            <MockButtons>
                <MockButton />
                <MockButton />
                <MockButton />
            </MockButtons>
            <DndContext
                onDragMove={({ delta }) => {
                    const newXPosition = initPositions.first.x + delta.x;
                    const newYPosition = initPositions.first.y + delta.y;

                    setCodePositions({
                        ...initPositions,
                        first: clampPosition({
                            x: newXPosition,
                            y: newYPosition,
                        }),
                    });
                }}
                onDragEnd={({ delta }) => {
                    setInitPositions((oldPositions) => ({
                        ...oldPositions,
                        first: clampPosition({
                            x: oldPositions.first.x + delta.x,
                            y: oldPositions.first.y + delta.y,
                        }),
                    }));
                }}
            >
                <FirstBox id={`${id}_first`} position={codePositions.first} />
            </DndContext>
            <DndContext
                onDragMove={({ delta }) => {
                    const newXPosition = initPositions.second.x + delta.x;
                    const newYPosition = initPositions.second.y + delta.y;

                    setCodePositions({
                        ...initPositions,
                        second: clampPosition({
                            x: newXPosition,
                            y: newYPosition,
                        }),
                    });
                }}
                onDragEnd={({ delta }) => {
                    setInitPositions((oldPositions) => ({
                        ...oldPositions,
                        second: clampPosition({
                            x: oldPositions.second.x + delta.x,
                            y: oldPositions.second.y + delta.y,
                        }),
                    }));
                }}
            >
                <SecondBox
                    id={`${id}_second`}
                    position={codePositions.second}
                />
            </DndContext>
        </Root>
    );
};
