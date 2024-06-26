import { Card } from "@pluv-internal/react-components/either";
import { cn } from "@pluv-internal/utils";
import { oneLine } from "common-tags";
import type { CSSProperties, FC, ReactNode } from "react";

export interface HomeFeaturesSectionFeatureProps {
    className?: string;
    description: ReactNode;
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
        <Card
            className={cn(
                oneLine`
                    flex
                    flex-col
                    items-start
                    rounded-lg
                    border-2
                    border-solid
                    border-indigo-700/60
                    p-4
                    shadow-lg
                    shadow-indigo-800
                `,
                className,
            )}
            style={style}
        >
            <h3 className="text-left text-lg font-bold md:text-xl">{title}</h3>
            <p className="text-sm leading-tight text-muted-foreground md:text-base">{description}</p>
        </Card>
    );
};
