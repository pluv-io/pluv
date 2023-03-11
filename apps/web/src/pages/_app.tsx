import { LaserWaveTheme } from "@pluv-internal/react-code";
import { GlobalStyles } from "@pluv-internal/react-components";
import "../styles/tailwind.css";

import { NextPage } from "next";
import type { AppProps } from "next/app";

export const CustomApp: NextPage<AppProps> = ({ Component, pageProps }) => {
    return (
        <>
            <GlobalStyles />
            <LaserWaveTheme />
            <Component {...pageProps} />
        </>
    );
};

export default CustomApp;
