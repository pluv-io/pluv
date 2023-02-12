import { createGlobalStyle } from "styled-components";
import tw, { GlobalStyles as BaseStyles } from "twin.macro";

const CustomStyles = createGlobalStyle`
    ${tw`
        antialiased
    `}

    html {
        color-scheme: dark;
    }

    html, body {
        ${tw`
            bg-stone-900
        `}
    }
`;

export const GlobalStyles = () => (
    <>
        <BaseStyles />
        <CustomStyles />
    </>
);
