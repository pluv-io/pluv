import { useDraggable } from "@dnd-kit/core";
import { cn } from "@pluv-internal/utils";
import composeRefs from "@seznam/compose-react-refs";
import { oneLine } from "common-tags";
import type { CSSProperties } from "react";
import { forwardRef } from "react";

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
        <div
            className={cn(
                oneLine`
                    relative
                    flex
                    items-center
                    justify-center
                `,
                className,
            )}
            style={style}
        >
            <div
                ref={composeRefs<HTMLDivElement>(ref, setNodeRef)}
                {...attributes}
                {...listeners}
                className={oneLine`
                    absolute
                    size-[48px]
                    cursor-grab
                    rounded-lg
                    bg-current
                    md:size-[84px]
                    [&[data-selected="true"]]:cursor-grabbing
                `}
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
                    <div
                        className={oneLine`
                            pointer-events-none
                            absolute
                            -top-8
                            left-1/2
                            -translate-x-1/2
                            px-1.5
                        `}
                    >
                        <span className="text-sm font-semibold">{user}</span>
                        <div
                            className={oneLine`
                                absolute
                                inset-0
                                rounded-md
                                bg-current
                                opacity-20
                            `}
                        />
                    </div>
                )}
                {selected && (
                    <div
                        className={oneLine`
                            absolute
                            -inset-1
                            rounded-xl
                            border-2
                            border-solid
                            border-current
                        `}
                    />
                )}
            </div>
        </div>
    );
});

HomeCodeDemoBox.displayName = "HomeCodeDemoBox";
