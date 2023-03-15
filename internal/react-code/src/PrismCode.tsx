import { clsx } from "clsx";
import Highlight, { defaultProps } from "prism-react-renderer";
import { CSSProperties, FC } from "react";
import { forwardRef, memo } from "react";
import tw, { styled } from "twin.macro";

export type Language =
    | "markup"
    | "bash"
    | "clike"
    | "c"
    | "cpp"
    | "css"
    | "javascript"
    | "jsx"
    | "coffeescript"
    | "actionscript"
    | "css-extr"
    | "diff"
    | "git"
    | "go"
    | "graphql"
    | "handlebars"
    | "json"
    | "less"
    | "makefile"
    | "markdown"
    | "objectivec"
    | "ocaml"
    | "python"
    | "reason"
    | "sass"
    | "scss"
    | "sql"
    | "stylus"
    | "tsx"
    | "typescript"
    | "wasm"
    | "yaml";

const Pre = styled.pre`
    ${tw`
        text-left
        overflow-auto
        p-[0.5em]
        font-mono
        hover:[::-webkit-scrollbar-thumb]:block
    `}

    &::-webkit-scrollbar {
        width: 8px;
        height: 8px;
    }

    &::-webkit-scrollbar-track,
    &::-webkit-scrollbar-corner {
        ${tw`
            bg-transparent
        `}
    }

    &::-webkit-scrollbar-thumb {
        ${tw`
            hidden
            bg-gray-700/40
            rounded-full
        `}
    }
`;

const Line = tw.div`
    table-row
`;

const LineNo = tw.span`
    table-cell
    text-left
    pr-[1em]
    select-none
    opacity-50
`;

const LineContent = tw.span`
    table-cell
`;

export type TokenInputProps = Parameters<
    Highlight["getTokenProps"]
>[0]["token"];

export type TokenOutputProps = ReturnType<Highlight["getTokenProps"]>;

export interface PrismCodeTokenProps {
    index: number;
    line: readonly TokenInputProps[];
    lineNo: number;
    tokenProps: TokenOutputProps;
}

export interface PrismCodeProps {
    children?: string;
    className?: string;
    language?: Language;
    style?: CSSProperties;
    tokenRenderer?: FC<PrismCodeTokenProps>;
}

export const PrismCode = memo(
    forwardRef<HTMLPreElement, PrismCodeProps>((props, ref) => {
        const {
            children = "",
            className: _className,
            language = "tsx",
            style: _style,
            tokenRenderer: Token = ({ tokenProps }) => <span {...tokenProps} />,
        } = props;

        return (
            <Highlight
                {...defaultProps}
                code={children}
                language={language}
                theme={{ plain: {}, styles: [] }}
            >
                {({
                    className,
                    style,
                    tokens,
                    getLineProps,
                    getTokenProps,
                }) => (
                    <Pre
                        ref={ref}
                        className={clsx(_className, className)}
                        style={{ ..._style, ...style }}
                    >
                        {tokens.map((line, i) => (
                            <Line key={i} {...getLineProps({ line, key: i })}>
                                <LineNo>{i + 1}</LineNo>
                                <LineContent>
                                    {line.map((token, key) => (
                                        <Token
                                            key={key}
                                            index={key}
                                            line={line}
                                            lineNo={i + 1}
                                            tokenProps={getTokenProps({
                                                token,
                                                key,
                                            })}
                                        />
                                    ))}
                                </LineContent>
                            </Line>
                        ))}
                    </Pre>
                )}
            </Highlight>
        );
    })
);

PrismCode.displayName = "PrismCode";
