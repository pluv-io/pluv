import { NextPage } from "next";
import type { AppProps } from "next/app";

import "../styles/styles.css";

export const CustomApp: NextPage<AppProps> = ({ Component, pageProps }) => {
    return <Component {...pageProps} />;
};

export default CustomApp;
