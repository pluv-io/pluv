import { Language, PrismCode } from "@pluv-internal/react-code";
import { CSSProperties, FC, ReactNode, useMemo } from "react";

export interface MdxPreProps {
    children?: ReactNode;
    className?: string;
    style?: CSSProperties;
}

export const MdxPre: FC<MdxPreProps> = (props) => {
    const { children, className, style } = props;

    const language = useMemo(() => {
        return className?.startsWith("language")
            ? className.replace(/language-/, "")
            : "tsx";
    }, [className]) as Language;

    const contents = typeof children === "string" ? children : "";

    return (
        <PrismCode className={className} language={language} style={style}>
            {contents}
        </PrismCode>
    );
};
