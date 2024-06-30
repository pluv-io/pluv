import bundleAnalyzerPlugin from "@next/bundle-analyzer";
import createMdx from "@next/mdx";
import { frontmatter } from "@pluv-internal/remark-plugins";
import withPlugins from "next-compose-plugins";
import remarkGfm from "remark-gfm";

const withBundleAnalyzer = bundleAnalyzerPlugin({
    enabled: process.env.BUNDLE_ANALYZE === "true",
});

const withMdx = createMdx({
    extension: /\.mdx?$/,
    options: {
        remarkPlugins: [frontmatter, remarkGfm],
        rehypePlugins: [],
    },
});

/** @type {import("next").NextConfig} */
const config = {
    experimental: {
        externalDir: true,
        serverComponentsExternalPackages: ["@shikijs/twoslash", "shiki", "shiki/wasm", "vscode-oniguruma"],
        /**
         * !HACK
         * @description This is to resolve ERR_REQUIRE_ESM outlined in this github issue comment
         * @link https://github.com/vercel/next.js/issues/64434#issuecomment-2082964050
         * @date June 29, 2024
         */
        // optimizePackageImports: ["shiki"],
    },
    i18n: {
        locales: ["en-US"],
        defaultLocale: "en-US",
    },
    images: {
        deviceSizes: [320, 420, 768, 1024, 1200],
        domains: [],
        loader: "default",
    },
    pageExtensions: ["ts", "tsx", "js", "jsx", "md", "mdx"],
    reactStrictMode: true,
    rewrites: () => {
        return {
            beforeFiles: [
                {
                    source: "/api/:path*",
                    destination: "https://app.pluv.io/api/:path*",
                },
            ],
        };
    },
    env: {
        WS_ENDPOINT: process.env.WS_ENDPOINT,
    },
    webpack: (config) => {
        config.experiments = {
            layers: true,
            asyncWebAssembly: true,
        };

        return config;
    },
};

export default withPlugins([withBundleAnalyzer, withMdx], config);
