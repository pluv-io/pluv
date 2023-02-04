import "../styles/tailwind.css";

import { NextPage } from "next";
import type { AppProps } from "next/app";

export const CustomApp: NextPage<AppProps> = ({ Component, pageProps }) => {
    return <Component {...pageProps} />;
};

export default CustomApp;
