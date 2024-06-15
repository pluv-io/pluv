import { LazyMotion } from "@pluv-internal/react-components/client";
import { NextPage } from "next";
import type { AppProps } from "next/app";
import { Inter } from "next/font/google";
import { SiteWideLayout } from "../components";

const inter = Inter({ subsets: ["latin"], display: "swap" });

import "@pluv-internal/react-code/styles.css";
import "../styles/global.css";

export const CustomApp: NextPage<AppProps> = ({ Component, pageProps }) => {
    return (
        <LazyMotion>
            <SiteWideLayout className={inter.className}>
                <Component {...pageProps} />
            </SiteWideLayout>
        </LazyMotion>
    );
};

export default CustomApp;
