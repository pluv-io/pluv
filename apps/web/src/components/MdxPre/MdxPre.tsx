import type { InferComponentProps } from "@pluv-internal/typings";
import { cn } from "@pluv-internal/utils";
import { oneLine } from "common-tags";
import type { FC, PropsWithChildren, ReactElement, ReactNode } from "react";
import { isValidElement } from "react";
import type { ShikiLanguage } from "../../utils/getShiki";
import { ServerCodeBlock } from "../ServerCodeBlock";

export type MdxPreProps = InferComponentProps<"pre">;

const hasChildren = (element: ReactNode): element is ReactElement<PropsWithChildren> => {
    return isValidElement(element) && !!element.props.children;
};

const getChildrenText = (children: ReactNode): string => {
    return hasChildren(children)
        ? getChildrenText(children.props.children)
        : typeof children === "string"
          ? children
          : "";
};

const parseLanguage = (className?: string): string | null => {
    const parsed = className?.replace(/language-/, "") ?? null;

    if (parsed === "ts" || parsed === "typescript") return "tsx";

    return parsed;
};

const getChildrenLanguage = (children: ReactNode): string => {
    if (!isValidElement(children)) return "tsx";

    const _language = parseLanguage(children.props.className);

    if (_language) return _language;
    if (!hasChildren(children)) return "tsx";

    return getChildrenLanguage(children.props.children);
};

export const MdxPre: FC<MdxPreProps> = (props) => {
    const { children, className, style, ...restProps } = props;

    const contents = getChildrenText(children).trimEnd();
    const language = (parseLanguage(className) ?? getChildrenLanguage(children) ?? "text") as ShikiLanguage;

    return (
        <ServerCodeBlock
            {...(restProps as InferComponentProps<"div">)}
            className={cn(
                oneLine`
                    flex
                    w-full
                    min-w-full
                    flex-col
                    items-stretch
                    overflow-auto
                    rounded
                    border
                    border-border
                    shadow
                `,
                className,
            )}
            code={contents}
            lang={language}
        />
    );
};
