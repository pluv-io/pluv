import NextHead from "next/head";
import type { FC } from "react";

export interface SeoTitleProps {
    postfix?: boolean;
    title: string;
}

export const SeoTitle: FC<SeoTitleProps> = ({
    postfix = true,
    title: _title,
}) => {
    const title = postfix ? `${_title} – pluv.io` : _title;

    return (
        <NextHead>
            <title key="title">{title}</title>
            <meta key="schema:title" content={title} itemProp="name" />
            <meta key="og:title" content={title} property="og:title" />
            <meta key="twitter:title" name="twitter:title" content={title} />
        </NextHead>
    );
};
