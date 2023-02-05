import "../styles/tailwind.css";

import { GlobalStyles } from "@pluv-internal/react-components";
import { NextPage } from "next";
import type { AppProps } from "next/app";

export const CustomApp: NextPage<AppProps> = ({ Component, pageProps }) => {
    return (
        <>
            <GlobalStyles />
            <Component {...pageProps} />
        </>
    );
};

export default CustomApp;
