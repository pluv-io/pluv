import bundleAnalyzer from "@next/bundle-analyzer";
import withMdx from "@next/mdx";
import withPlugins from "next-compose-plugins";
import remarkGfm from "remark-gfm";

const withBundleAnalyzer = bundleAnalyzer({
	enabled: process.env.BUNDLE_ANALYZE === "true",
});

/** @type {import("next").NextConfig} */
const config = {
    experimental: {
        externalDir: true,
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
	env: {
		WS_ENDPOINT: process.env.WS_ENDPOINT,
	},
};

export default withPlugins([
	withBundleAnalyzer,
	[withMdx, {
		extension: /\.mdx?$/,
		options: {
			remarkPlugins:  [[remarkGfm, {}]],
			rehypePlugins: [],
		},
	}],
], config);