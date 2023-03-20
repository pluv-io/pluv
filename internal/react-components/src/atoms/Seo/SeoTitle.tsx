import NextHead from "next/head";
import type { FC } from "react";

export interface SeoTitleProps {
    title: string;
}

export const SeoTitle: FC<SeoTitleProps> = ({ title }) => {
    return (
        <NextHead>
            <title key="title">{title}</title>
            <meta key="schema:title" content={title} itemProp="name" />
            <meta key="og:title" content={title} property="og:title" />
            <meta key="twitter:title" name="twitter:title" content={title} />
        </NextHead>
    );
};
