import { createGlobalStyle } from "styled-components";
import tw, { GlobalStyles as BaseStyles } from "twin.macro";

const CustomStyles = createGlobalStyle`
    ${tw`
        antialiased
    `}
`;

export const GlobalStyles = () => (
    <>
        <BaseStyles />
        <CustomStyles />
    </>
);
