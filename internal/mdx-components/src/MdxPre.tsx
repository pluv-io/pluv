import type { Language } from "@pluv-internal/react-code";
import { PrismCode } from "@pluv-internal/react-code";
import type { InferComponentProps } from "@pluv-internal/typings";
import { cn } from "@pluv-internal/utils";
import type { PropsWithChildren, ReactElement, ReactNode } from "react";
import { forwardRef, isValidElement, useCallback, useMemo } from "react";

export type MdxPreProps = InferComponentProps<"pre">;

export const MdxPre = forwardRef<HTMLPreElement, MdxPreProps>((props, ref) => {
    const { children, className, style, ...restProps } = props;

    const hasChildren = useCallback((element: ReactNode): element is ReactElement<PropsWithChildren> => {
        return isValidElement(element) && !!element.props.children;
    }, []);

    const contents = useMemo(() => {
        const getChildrenText = (_children: ReactNode): string => {
            return hasChildren(_children)
                ? getChildrenText(_children.props.children)
                : typeof _children === "string"
                  ? _children
                  : "";
        };

        return getChildrenText(children).trimEnd();
    }, [children, hasChildren]);

    const language = useMemo(() => {
        const parseLanguage = (_className?: string): string | null => {
            return _className?.replace(/language-/, "") ?? null;
        };

        const getChildrenLanguage = (_children: ReactNode): string => {
            if (!isValidElement(_children)) return "tsx";

            const _language = parseLanguage(_children.props.className);

            if (_language) return _language;
            if (!hasChildren(_children)) return "tsx";

            return getChildrenLanguage(_children.props.children);
        };

        return parseLanguage(className) ?? getChildrenLanguage(children);
    }, [children, className, hasChildren]) as Language;

    return (
        <PrismCode
            {...restProps}
            className={cn("w-full rounded-md border border-indigo-500/40", className)}
            language={language}
            ref={ref}
            style={style}
        >
            {contents}
        </PrismCode>
    );
});

MdxPre.displayName = "MdxPre";
