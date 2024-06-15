import { cn } from "@pluv-internal/utils";
import { oneLine } from "common-tags";
import type { CSSProperties, FC } from "react";

export interface HomeFeaturesSectionFeatureProps {
    className?: string;
    description: string;
    style?: CSSProperties;
    title: string;
}

export const HomeFeaturesSectionFeature: FC<HomeFeaturesSectionFeatureProps> = ({
    className,
    description,
    style,
    title,
}) => {
    return (
        <div
            className={cn(
                oneLine`
                    flex
                    flex-col
                    items-start
                    rounded-lg
                    border-2
                    border-solid
                    border-indigo-700/60
                    bg-zinc-800
                    p-4
                    shadow-lg
                    shadow-indigo-800
                `,
                className,
            )}
            style={style}
        >
            <h3 className="text-left text-lg font-bold md:text-xl">{title}</h3>
            <p className="text-sm text-slate-200 md:text-base">{description}</p>
        </div>
    );
};
