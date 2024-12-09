import { useWindowFocus } from "@pluv-internal/react-hooks";
import type { ComponentProps } from "react";
import { cn } from "@pluv-internal/utils";
import { oneLine } from "common-tags";
import { m, useScroll } from "framer-motion";
import { forwardRef, useEffect, useState } from "react";

const SCROLL_THRESHOLD = 32;
const SCROLL_PROGRESS_THRESHOLD = 0.95;

export type AppBarProps = ComponentProps<typeof m.div> & {
    active?: boolean;
};

export const AppBar = forwardRef<HTMLDivElement, AppBarProps>((props, ref) => {
    const { active, className, ...restProps } = props;

    const { scrollY, scrollYProgress } = useScroll();
    const focused = useWindowFocus();

    const [isThreshold, setIsThreshold] = useState<boolean>(true);

    useEffect(() => {
        const getIsThreshold = (y: number) => {
            return y > SCROLL_THRESHOLD || scrollYProgress.get() > SCROLL_PROGRESS_THRESHOLD;
        };

        setIsThreshold(getIsThreshold(scrollY.get()));

        const unsubscribeScrollY = scrollY.on("change", (y) => {
            setIsThreshold(getIsThreshold(y));
        });

        return () => {
            unsubscribeScrollY();
        };
    }, [focused, scrollY, scrollYProgress]);

    return (
        <m.div
            {...restProps}
            ref={ref}
            className={cn(
                oneLine`
                    sticky
                    inset-x-0
                    top-0
                    z-app-bar
                    h-14
                    border-b
                    border-b-border
                    px-4
                    shadow-lg
                `,
                className,
            )}
            initial={false}
            animate={active ? "open" : isThreshold ? "scrolled" : "default"}
            variants={{
                default: {
                    backgroundColor: "hsla(var(--background) / 0)",
                    boxShadow: "inset 0 -1px 0 0 hsla(var(--shadow) / 0%)",
                    backdropFilter: "blur(0px)",
                },
                scrolled: {
                    backgroundColor: "hsla(var(--background) / 85%)",
                    boxShadow: "inset 0 -1px 0 0 hsla(var(--shadow) / 10%)",
                    backdropFilter: "blur(8px)",
                },
                open: {
                    backgroundColor: "hsla(var(--background) / 100%)",
                    boxShadow: "inset 0 -1px 0 0 hsla(var(--shadow) / 10%)",
                    backdropFilter: "blur(0px)",
                },
            }}
            transition={{
                duration: 0.15,
                ease: "easeInOut",
            }}
        />
    );
});

AppBar.displayName = "AppBar";
