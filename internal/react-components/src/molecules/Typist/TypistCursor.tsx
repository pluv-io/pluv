import { clsx } from "clsx";
import { CSSProperties, FC } from "react";
import { keyframes } from "styled-components";
import tw, { styled } from "twin.macro";

const blink = keyframes`
	0% {
        opacity: 1
    }
    50% {
        opacity: 0
    }
    to {
        opacity: 1
    }
`;

export const TypistCursor = styled.span`
    ${tw`
		font-medium
	`}
    font-size: 0.84em;
    opacity: 1;
    animation: ${blink} 1s linear infinite;
`;

TypistCursor.defaultProps = {
    children: "|",
};
