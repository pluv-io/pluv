import { NextPage } from "next";
import type { AppProps } from "next/app";

// oxlint-disable-next-line import/no-unassigned-import -- side-effect CSS import
import "@blocknote/mantine/style.css";
// oxlint-disable-next-line import/no-unassigned-import -- side-effect CSS import
import "../styles/styles.css";

export const CustomApp: NextPage<AppProps> = ({ Component, pageProps }) => {
    return <Component {...pageProps} />;
};

export default CustomApp;
