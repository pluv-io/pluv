import { cn } from "@pluv-internal/utils";
import { oneLine } from "common-tags";
import type { CSSProperties, FC } from "react";
import { HomeCodeDemoBrowser } from "./HomeCodeDemoBrowser";

export interface HomeCodeDemoUserDemoProps {
    className?: string;
    style?: CSSProperties;
}

export const HomeCodeDemoUserDemo: FC<HomeCodeDemoUserDemoProps> = ({ className, style }) => {
    return (
        <div
            className={cn(
                oneLine`
                    flex
                    flex-row
                    items-stretch
                    gap-[0]
                    sm:gap-[16px]
                    md:flex-col
                    md:gap-[32px]
                `,
                className,
            )}
            style={style}
        >
            <HomeCodeDemoBrowser
                className={oneLine`
                    min-h-0
                    grow
                    basis-0
                    rounded-md
                    first:rounded-r-none
                    last:rounded-l-none
                    sm:first:rounded-r-md
                    sm:last:rounded-l-md
                `}
                id="user1"
                user="jane"
            />
            <HomeCodeDemoBrowser
                className={oneLine`
                    min-h-0
                    grow
                    basis-0
                    rounded-md
                    first:rounded-r-none
                    last:rounded-l-none
                    sm:first:rounded-r-md
                    sm:last:rounded-l-md
                `}
                id="user2"
                user="john"
            />
        </div>
    );
};
