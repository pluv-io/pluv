import { MdxProvider } from "@pluv-internal/mdx-components";
import { LaserWaveTheme } from "@pluv-internal/react-code";
import { GlobalStyles } from "@pluv-internal/react-components";
import { NextPage } from "next";
import type { AppProps } from "next/app";
import { SiteWideLayout } from "../components";

import "../styles/tailwind.css";

export const CustomApp: NextPage<AppProps> = ({ Component, pageProps }) => {
    return (
        <>
            <GlobalStyles />
            <LaserWaveTheme />
            <SiteWideLayout style={{ ...(Component as any).style }}>
                <MdxProvider>
                    <Component {...pageProps} />
                </MdxProvider>
            </SiteWideLayout>
        </>
    );
};

export default CustomApp;
