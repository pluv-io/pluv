import type { InferComponentProps } from "@pluv-internal/typings";
import { cn } from "@pluv-internal/utils";
import { oneLine } from "common-tags";
import { Highlight } from "prism-react-renderer";
import type { CSSProperties, FC } from "react";
import { forwardRef, memo } from "react";

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

export interface TokenInputProps {
    types: string[];
    content: string;
    empty?: boolean;
}

export interface TokenOutputProps {
    style?: CSSProperties;
    className: string;
    children: string;
    [key: string]: unknown;
}

export interface PrismCodeTokenProps {
    index: number;
    line: readonly TokenInputProps[];
    lineNo: number;
    tokenProps: TokenOutputProps;
}

export type PrismCodeProps = Omit<InferComponentProps<"pre">, "children"> & {
    children?: string;
    language?: Language;
    tokenRenderer?: FC<PrismCodeTokenProps>;
};

export const PrismCode = memo(
    forwardRef<HTMLPreElement, PrismCodeProps>((props, ref) => {
        const {
            children = "",
            className: _className,
            language = "tsx",
            style: _style,
            tokenRenderer: Token = ({ tokenProps }) => <span {...tokenProps} key={tokenProps.key as string | number} />,
            ...restProps
        } = props;

        return (
            <Highlight code={children} language={language} theme={{ plain: {}, styles: [] }}>
                {({ className, style, tokens, getLineProps, getTokenProps }) => (
                    <pre
                        {...restProps}
                        ref={ref}
                        className={cn(
                            oneLine`
                                hover:[::-webkit-scrollbar-thumb]:block
                                overflow-auto
                                p-[0.5em]
                                text-left
                                font-mono
                                [&::-webkit-scrollbar-corner]:bg-transparent
                                [&::-webkit-scrollbar-thumb]:hidden
                                [&::-webkit-scrollbar-thumb]:rounded-full
                                [&::-webkit-scrollbar-thumb]:bg-gray-700/40
                                [&::-webkit-scrollbar-track]:bg-transparent
                                [&::-webkit-scrollbar]:h-[8px]
                                [&::-webkit-scrollbar]:w-[8px]
                            `,
                            _className,
                            className,
                        )}
                        style={{ ..._style, ...style }}
                    >
                        {tokens.map((line, i) => (
                            <div {...getLineProps({ className: "table-row", line })} key={i}>
                                <span className="table-cell select-none pr-[1em] text-left opacity-50">{i + 1}</span>
                                <span className="table-cell">
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
                                </span>
                            </div>
                        ))}
                    </pre>
                )}
            </Highlight>
        );
    }),
);

PrismCode.displayName = "PrismCode";
