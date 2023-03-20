import NextHead from "next/head";
import { useRouter } from "next/router";
import { FC, useMemo } from "react";

export interface SeoMiscProps {
    canonical?: string;
    ogType?: string;
    origin?: string;
    robots?: {
        follow?: boolean;
        index?: boolean;
    };
}

export const SeoMisc: FC<SeoMiscProps> = ({
    canonical: _canonical = "",
    ogType,
    origin: _origin,
    robots: _robots,
}) => {
    const { index, follow } = { index: false, follow: false, ..._robots };

    const router = useRouter();

    const locale = router?.locale ?? "en-US";
    const origin =
        _origin ||
        process.env.BASE_URL ||
        process.env.VERCEL_URL ||
        process.env.DEPLOY_URL;

    const canonical = `${origin}${_canonical.replace(/\/+$/g, "")}`;

    const robots: readonly string[] = useMemo(
        () =>
            process.env.SEO === "true"
                ? [index ? "index" : "noindex", follow ? "follow" : "nofollow"]
                : ["noindex", "nofollow"],
        [index, follow]
    );

    return (
        <NextHead>
            {locale && (
                <meta
                    key="og:locale"
                    content={locale.replace("-", "_")}
                    property="og:locale"
                />
            )}
            {ogType && (
                <meta key="og:type" content={ogType} property="og:type" />
            )}
            {canonical && (
                <>
                    <link rel="canonical" href={canonical} />
                    <meta key="og:url" content={canonical} property="og:url" />
                </>
            )}
            {robots && (
                <meta key="robots" content={robots.join(",")} name="robots" />
            )}
        </NextHead>
    );
};
