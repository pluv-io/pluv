import { createGlobalStyle, CSSObject } from "styled-components";
import tw, { globalStyles } from "twin.macro";

const baseStyles = Object.fromEntries(
    Object.entries(globalStyles).filter(
        ([prop]) =>
            prop !== "button, [type='button'], [type='reset'], [type='submit']"
    )
) as CSSObject;

const CustomStyles = createGlobalStyle`
    ${tw`
        antialiased
    `}

    ${baseStyles}

    html {
        color-scheme: dark;
    }

    html, body {
        ${tw`
            bg-stone-900
            scroll-pt-20
        `}
    }
`;

export const GlobalStyles = () => <CustomStyles />;
