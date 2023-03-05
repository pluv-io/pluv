import type { CSSProperties, FC } from "react";
import tw from "twin.macro";

const Root = tw.div`
    flex
    flex-col
    items-start
    p-4
    border-2
    border-solid
    border-indigo-700/60
    rounded-lg
    shadow-lg
    shadow-indigo-800
    bg-zinc-800
`;

const Title = tw.h3`
    text-lg
    font-bold
    text-left
    md:text-xl
`;

const Description = tw.p`
    text-sm
    text-slate-200
    md:text-base
`;

export interface HomeFeaturesSectionFeatureProps {
    className?: string;
    description: string;
    style?: CSSProperties;
    title: string;
}

export const HomeFeaturesSectionFeature: FC<
    HomeFeaturesSectionFeatureProps
> = ({ className, description, style, title }) => {
    return (
        <Root className={className} style={style}>
            <Title>{title}</Title>
            <Description>{description}</Description>
        </Root>
    );
};
