import NextDocument, { DocumentContext, Head, Html, Main, NextScript } from "next/document";
import React from "react";
import { ServerStyleSheet } from "styled-components";

class CustomDocument extends NextDocument {
    static async getInitialProps(ctx: DocumentContext) {
        const sheet = new ServerStyleSheet();

        const originalRenderPage = ctx.renderPage;

        try {
            ctx.renderPage = () => {
                return originalRenderPage({
                    enhanceApp: (App) => (props) => sheet.collectStyles(<App {...props} />),
                });
            };

            const initialProps = await NextDocument.getInitialProps(ctx);

            return {
                ...initialProps,
                styles: (
                    <>
                        {initialProps.styles}
                        {sheet.getStyleElement()}
                    </>
                ) as any,
            };
        } finally {
            sheet.seal();
        }
    }

    render() {
        return (
            <Html className="dark">
                <Head>
                    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
                    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
                    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
                    <link rel="manifest" href="/site.webmanifest" />
                    <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#3730a3" />
                    <meta name="msapplication-TileColor" content="#3730a3" />
                    <meta name="theme-color" content="#3730a3" />
                    <link
                        href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Source+Code+Pro:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap"
                        rel="stylesheet"
                    />
                    <link href="https://fonts.googleapis.com/css2?family=Inconsolata&display=swap" rel="stylesheet" />
                </Head>
                <body>
                    <Main />
                    <NextScript />
                </body>
            </Html>
        );
    }
}

export default CustomDocument;
