import { Language, PrismCode } from "@pluv-internal/react-code";
import { InferComponentProps } from "@pluv-internal/typings";
import {
    FC,
    isValidElement,
    PropsWithChildren,
    ReactElement,
    ReactNode,
    useCallback,
    useMemo,
} from "react";
import tw from "twin.macro";

const Root = tw(PrismCode)`
    w-full
    border
    border-indigo-500/40
    rounded-md
`;

export type MdxPreProps = Omit<InferComponentProps<"code">, "ref">;

export const MdxPre: FC<MdxPreProps> = (props) => {
    const { children, className, style } = props;

    const hasChildren = useCallback(
        (element: ReactNode): element is ReactElement<PropsWithChildren> => {
            return isValidElement(element) && !!element.props.children;
        },
        []
    );

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
        return className?.startsWith("language")
            ? className.replace(/language-/, "")
            : "tsx";
    }, [className]) as Language;

    return (
        <Root className={className} language={language} style={style}>
            {contents}
        </Root>
    );
};
