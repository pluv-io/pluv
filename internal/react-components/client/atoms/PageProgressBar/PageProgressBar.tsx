import { oneLine } from "common-tags";
import NextTopLoader, { type NextTopLoaderProps } from "nextjs-toploader";
import type { FC } from "react";

export type PageProgressBarProps = NextTopLoaderProps;

export const PageProgressBar: FC<PageProgressBarProps> = ({
    color = oneLine`
        linear-gradient(
            -80deg,
            #db2777,
            #7c3aed,
            #3b82f6
        )
    `,
    crawlSpeed = 150,
    crawl = true,
    easing = "ease",
    height = 6,
    initialPosition = 0.08,
    showSpinner = false,
    zIndex = 9999,
    ...restProps
}) => {
    return (
        <NextTopLoader
            color={color}
            crawlSpeed={crawlSpeed}
            crawl={crawl}
            easing={easing}
            height={height}
            initialPosition={initialPosition}
            showSpinner={showSpinner}
            zIndex={zIndex}
            {...restProps}
        />
    );
};
