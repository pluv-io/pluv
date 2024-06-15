import { DndContext } from "@dnd-kit/core";
import { cn } from "@pluv-internal/utils";
import { oneLine } from "common-tags";
import type { CSSProperties, FC, MouseEvent } from "react";
import { useCallback, useContext, useMemo, useState } from "react";
import { HomeCodeDemoBox } from "./HomeCodeDemoBox";
import type { HomeCodeDemoPosition, HomeCodeDemoSelections } from "./context";
import { HomeCodeDemoContext } from "./context";

const didClickIn = (element: HTMLDivElement | null, event: MouseEvent<HTMLDivElement>): boolean => {
    return !element || element.contains(event.target as Node | null);
};

export interface HomeCodeDemoBrowserProps {
    className?: string;
    id: string;
    style?: CSSProperties;
    user: keyof HomeCodeDemoSelections;
}

export const HomeCodeDemoBrowser: FC<HomeCodeDemoBrowserProps> = ({ className, id, style, user }) => {
    const { boxSize, codePositions, initPositions, selections, setCodePositions, setInitPositions, setSelections } =
        useContext(HomeCodeDemoContext);

    const { [user]: myself, ...others } = selections;

    const [box1, box1Ref] = useState<HTMLDivElement | null>(null);
    const [box2, box2Ref] = useState<HTMLDivElement | null>(null);

    const otherUser = useMemo(() => (Object.keys(others)[0] ?? null) as keyof HomeCodeDemoSelections | null, [others]);

    const other = useMemo(() => {
        if (!otherUser) return null;

        return (others as HomeCodeDemoSelections)[otherUser];
    }, [others, otherUser]);

    const [rootElem, rootRef] = useState<HTMLDivElement | null>(null);

    const clampPosition = useCallback(
        (position: HomeCodeDemoPosition): HomeCodeDemoPosition => {
            const rootRect = rootElem?.getBoundingClientRect();

            if (!rootRect) return position;

            const minWidth = rootRect.width / -2 + boxSize / 2;
            const maxWidth = rootRect.width / 2 - boxSize / 2;
            const minHeight = rootRect.height / -2 + boxSize / 2;
            const maxHeight = rootRect.height / 2 - boxSize / 2;

            const newXPosition = Math.min(Math.max(position.x, minWidth), maxWidth);
            const newYPosition = Math.min(Math.max(position.y, minHeight), maxHeight);

            return { x: newXPosition, y: newYPosition };
        },
        [boxSize, rootElem],
    );

    return (
        <div
            ref={rootRef}
            className={cn(
                oneLine`
                    relative
                    flex
                    items-center
                    justify-center
                    overflow-hidden
                    border
                    border-solid
                    border-indigo-500/40
                `,
                className,
            )}
            onClick={(e) => {
                if (didClickIn(box1, e) || didClickIn(box2, e)) return;

                setSelections((oldSelections) => ({
                    ...oldSelections,
                    [user]: null,
                }));
            }}
            style={style}
        >
            <div className="pointer-events-none absolute left-5 top-5 flex flex-row items-center gap-1">
                <span className="size-2 rounded-full bg-gray-500/20" />
                <span className="size-2 rounded-full bg-gray-500/20" />
                <span className="size-2 rounded-full bg-gray-500/20" />
            </div>
            <span
                className={oneLine`
                    absolute
                    right-5
                    top-4
                    text-sm
                    font-semibold
                    text-gray-500
                `}
            >
                {user}
            </span>
            <div
                className={oneLine`
                    absolute
                    bottom-4
                    left-1/2
                    -translate-x-1/2
                    whitespace-nowrap
                    text-sm
                    font-medium
                    text-gray-500
                `}
            >
                Drag the boxes
            </div>
            <DndContext
                id={`${id}_dnd_first`}
                onDragMove={({ delta }) => {
                    setCodePositions({
                        ...initPositions,
                        first: clampPosition({
                            x: initPositions.first.x + delta.x,
                            y: initPositions.first.y + delta.y,
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
                <HomeCodeDemoBox
                    ref={box1Ref}
                    id={`${id}_first`}
                    className="text-cyan-500"
                    onSelect={() => {
                        setSelections((oldSelections) => ({
                            ...oldSelections,
                            [user]: "first",
                        }));
                    }}
                    position={codePositions.first}
                    selected={myself === "first"}
                    user={other === "first" ? otherUser : null}
                />
            </DndContext>
            <DndContext
                id={`${id}_dnd_second`}
                onDragMove={({ delta }) => {
                    setCodePositions({
                        ...initPositions,
                        second: clampPosition({
                            x: initPositions.second.x + delta.x,
                            y: initPositions.second.y + delta.y,
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
                <HomeCodeDemoBox
                    ref={box2Ref}
                    id={`${id}_second`}
                    className="text-violet-500"
                    onSelect={() => {
                        setSelections((oldSelections) => ({
                            ...oldSelections,
                            [user]: "second",
                        }));
                    }}
                    position={codePositions.second}
                    selected={myself === "second"}
                    user={other === "second" ? otherUser : null}
                />
            </DndContext>
        </div>
    );
};
