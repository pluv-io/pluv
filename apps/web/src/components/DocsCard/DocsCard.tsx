import { Card, NextLink } from "@pluv-internal/react-components/either";
import { CSSProperties, FC } from "react";
import tw from "twin.macro";

const Root = tw(Card)`
    flex
    flex-col
    items-stretch
    gap-3
    p-4
    rounded-lg
`;

const Title = tw.h2`
    text-lg
    font-bold
`;

const Description = tw.p`
    truncate
    text-sm
`;

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
            <Root>
                <Title>📄️ {title}</Title>
                {!!description && <Description>{description}</Description>}
            </Root>
        </NextLink>
    );
};
