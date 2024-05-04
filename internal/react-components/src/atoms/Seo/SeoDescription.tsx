import NextHead from "next/head";
import type { FC } from "react";

export interface SeoDescriptionProps {
    description: string;
}

export const SeoDescription: FC<SeoDescriptionProps> = ({ description }) => {
    return (
        <NextHead>
            <meta key="description" content={description} name="description" />
            <meta key="og:description" content={description} property="og:description" />
            <meta key="twitter:description" content={description} name="twitter:description" />
        </NextHead>
    );
};
