import { clsx } from "clsx";
import Highlight, { defaultProps, Language } from "prism-react-renderer";
import { CSSProperties, memo } from "react";
import tw from "twin.macro";

const Pre = tw.pre`
    text-left
    overflow-scroll
    p-[0.5em]
    font-mono
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

export interface PrismCodeProps {
    children?: string;
    className?: string;
    language?: Language;
    style?: CSSProperties;
}

export const PrismCode = memo<PrismCodeProps>((props) => {
    const {
        children = "",
        className: _className,
        language = "tsx",
        style: _style,
    } = props;

    return (
        <Highlight
            {...defaultProps}
            code={children}
            language={language}
            theme={{ plain: {}, styles: [] }}
        >
            {({ className, style, tokens, getLineProps, getTokenProps }) => (
                <Pre
                    className={clsx(_className, className)}
                    style={{ ..._style, ...style }}
                >
                    {tokens.map((line, i) => (
                        <Line key={i} {...getLineProps({ line, key: i })}>
                            <LineNo>{i + 1}</LineNo>
                            <LineContent>
                                {line.map((token, key) => (
                                    <span
                                        key={key}
                                        {...getTokenProps({ token, key })}
                                    />
                                ))}
                            </LineContent>
                        </Line>
                    ))}
                </Pre>
            )}
        </Highlight>
    );
});

PrismCode.displayName = "PrismCode";
