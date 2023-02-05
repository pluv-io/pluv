import NextDocument, {
    DocumentContext,
    Head,
    Html,
    Main,
    NextScript,
} from "next/document";
import React from "react";
import { ServerStyleSheet } from "styled-components";

class CustomDocument extends NextDocument {
    static async getInitialProps(ctx: DocumentContext) {
        const sheet = new ServerStyleSheet();

        const originalRenderPage = ctx.renderPage;

        try {
            ctx.renderPage = () => {
                return originalRenderPage({
                    enhanceApp: (App) => (props) =>
                        sheet.collectStyles(<App {...props} />),
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
            <Html>
                <Head />
                <body>
                    <Main />
                    <NextScript />
                </body>
            </Html>
        );
    }
}

export default CustomDocument;
