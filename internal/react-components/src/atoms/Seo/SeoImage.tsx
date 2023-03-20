import NextHead from "next/head";
import type { FC } from "react";

export interface SeoImageProps {
    imageSrc: string;
}

export const SeoImage: FC<SeoImageProps> = ({ imageSrc }) => {
    if (!imageSrc) return null;

    return (
        <NextHead>
            <meta key="schema:image" content={imageSrc} itemProp="image" />
            <meta key="image" content={imageSrc} name="image" />
            <link key="image_src" href={imageSrc} rel="image_src" />
            <meta key="og:image" content={imageSrc} property="og:image" />
            <meta key="twitter:image" content={imageSrc} name="twitter:image" />
        </NextHead>
    );
};
