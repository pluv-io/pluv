import { LaserWaveTheme } from "@pluv-internal/react-code";
import { LazyMotion } from "@pluv-internal/react-components/client";
import { NextPage } from "next";
import type { AppProps } from "next/app";
import { SiteWideLayout } from "../components";

import "../styles/tailwind.css";

export const CustomApp: NextPage<AppProps> = ({ Component, pageProps }) => {
    return (
        <>
            <LaserWaveTheme />
            <LazyMotion>
                <SiteWideLayout>
                    <Component {...pageProps} />
                </SiteWideLayout>
            </LazyMotion>
        </>
    );
};

export default CustomApp;
