import NextHead from "next/head";
import { useRouter } from "next/router";
import type { FC } from "react";
import { SeoDescription, SeoDescriptionProps } from "./SeoDescription";
import { SeoImage, SeoImageProps } from "./SeoImage";
import { SeoMisc, SeoMiscProps } from "./SeoMisc";
import { SeoTitle, SeoTitleProps } from "./SeoTitle";

export type { SeoDescriptionProps } from "./SeoDescription";
export type { SeoImageProps } from "./SeoImage";
export type { SeoMiscProps } from "./SeoMisc";
export type { SeoTitleProps } from "./SeoTitle";

const OG_TTL = 345600;

export interface SeoProps
    extends Partial<SeoDescriptionProps>,
        Partial<SeoImageProps>,
        SeoMiscProps,
        SeoTitleProps {}

const _Seo: FC<SeoProps> = ({
    canonical: _canonical,
    description,
    imageSrc,
    ogType = "website",
    robots,
    title,
}) => {
    const router = useRouter();
    const canonical = _canonical ?? router.asPath;

    return (
        <>
            <SeoTitle title={title} />
            {!!description && <SeoDescription description={description} />}
            {!!imageSrc && <SeoImage imageSrc={imageSrc} />}
            <SeoMisc canonical={canonical} ogType={ogType} robots={robots} />
            <NextHead>
                <meta
                    key="og:site_name"
                    content="pluv.io"
                    property="og:site_name"
                />
                <meta
                    key="og:ttl"
                    content={OG_TTL.toString()}
                    property="og:ttl"
                />
                <meta
                    key="twitter:card"
                    content="summary_large_image"
                    name="twitter:card"
                />
            </NextHead>
        </>
    );
};

export const Seo = Object.assign(_Seo, {
    Description: SeoDescription,
    Image: SeoImage,
    Misc: SeoMisc,
    Title: SeoTitle,
});
