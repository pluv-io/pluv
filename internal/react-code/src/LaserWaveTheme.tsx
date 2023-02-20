import { createGlobalStyle } from "styled-components";

/*
 * Laserwave Theme originally by Jared Jones for Visual Studio Code
 * https://github.com/Jaredk3nt/laserwave
 *
 * Ported for PrismJS by Simon Jespersen [https://github.com/simjes]
 */

export const LaserWaveTheme = createGlobalStyle`
    code[class*="language-"],
    pre[class*="language-"] {
        background: transparent;
        color: #ffffff;
        /* The following properties are standard, please leave them as they are */
        font-size: 1em;
        direction: ltr;
        text-align: left;
        white-space: pre;
        word-spacing: normal;
        word-break: normal;
        line-height: 1.25;
        -moz-tab-size: 2;
        -o-tab-size: 2;
        tab-size: 2;
        /* The following properties are also standard */
        -webkit-hyphens: none;
        -moz-hyphens: none;
        -ms-hyphens: none;
        hyphens: none;
    }

    code[class*="language-"]::-moz-selection,
    code[class*="language-"] ::-moz-selection,
    pre[class*="language-"]::-moz-selection,
    pre[class*="language-"] ::-moz-selection {
        background: #eb64b927;
        color: inherit;
    }

    code[class*="language-"]::selection,
    code[class*="language-"] ::selection,
    pre[class*="language-"]::selection,
    pre[class*="language-"] ::selection {
        background: #eb64b927;
        color: inherit;
    }

    /* Properties specific to code blocks */
    pre[class*="language-"] {
        padding: 0.5em; /* this is standard */
        overflow: auto; /* this is standard */
    }

    /* Properties specific to inline code */
    :not(pre) > code[class*="language-"] {
        padding: 0.2em 0.3em;
        border-radius: 0.5rem;
        white-space: normal; /* this is standard */
    }

    .token.comment,
    .token.prolog,
    .token.cdata {
        color: #91889b;
    }

    .token.punctuation {
        color: #7b6995;
    }

    .token.builtin,
    .token.constant,
    .token.boolean {
        color: #ffe261;
    }

    .token.number {
        color: #b381c5;
    }

    .token.important,
    .token.atrule,
    .token.property,
    .token.keyword {
        color: #40b4c4;
    }

    .token.doctype,
    .token.operator,
    .token.inserted,
    .token.tag,
    .token.class-name,
    .token.symbol {
        color: #74dfc4;
    }

    .token.attr-name,
    .token.function,
    .token.deleted,
    .token.selector {
        color: #eb64b9;
    }

    .token.attr-value,
    .token.regex,
    .token.char,
    .token.string {
        color: #b4dce7;
    }

    .token.entity,
    .token.url,
    .token.variable {
        color: #ffffff;
    }

    /* The following rules are pretty similar across themes, but feel free to adjust them */
    .token.bold {
        font-weight: bold;
    }

    .token.italic {
        font-style: italic;
    }

    .token.entity {
        cursor: help;
    }

    .token.namespace {
        opacity: 0.7;
    }
`;
