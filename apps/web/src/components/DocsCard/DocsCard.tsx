import { Card, NextLink } from "@pluv-internal/react-components/either";
import { cn } from "@pluv-internal/utils";
import type { CSSProperties, FC } from "react";

export interface DocsCardProps {
    className?: string;
    description?: string;
    href: string;
    style?: CSSProperties;
    title: string;
}

export const DocsCard: FC<DocsCardProps> = ({ className, description, href, style, title }) => {
    return (
        <NextLink className={className} href={href} style={style}>
            <Card className={cn("flex flex-col items-stretch gap-3 rounded-lg p-4", className)}>
                <h2 className="text-lg font-bold">📄️ {title}</h2>
                {!!description && <p className="truncate text-sm">{description}</p>}
            </Card>
        </NextLink>
    );
};
