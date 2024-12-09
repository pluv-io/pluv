import { Anchor } from "@pluv-internal/react-components/either";
import { LinkIcon } from "@pluv-internal/react-icons";
import type { ComponentProps } from "react";
import { oneLine } from "common-tags";
import { forwardRef } from "react";
import { cn } from "../../utils/src";

export type MdxHeaderProps = ComponentProps<"h1"> & {
    type?: "header" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
};

export const MdxHeader = forwardRef<HTMLHeadingElement, MdxHeaderProps>((props, ref) => {
    const { children, className, style, type: HeaderType = "header", ...restProps } = props;

    const content = typeof children === "string" ? children : "";

    const hash = content
        .replace(/\s+/g, "-")
        .replace(/"/g, "")
        .replace(/\((.+)\)/g, ".$1")
        .replace(/[^a-zA-Z0-9-\.]/g, "");

    return (
        <Anchor
            className={cn(
                oneLine`
                    mb-[0.6em]
                    flex
                    flex-row
                    flex-nowrap
                    items-center
                    [&+p]:mt-0
                    [&:hover_svg]:opacity-100
                    [&:not(:first-child)]:mt-[1em]
                `,
                className,
            )}
            href={`#${hash}`}
            style={style}
        >
            <HeaderType {...restProps} className="inline text-wrap" id={hash} ref={ref}>
                {children}
                <LinkIcon
                    className="ml-[0.3em] hidden size-[0.625em] opacity-0 transition-opacity duration-75 ease-in sm:inline"
                    height={24}
                    width={24}
                />
            </HeaderType>
        </Anchor>
    );
});

MdxHeader.displayName = "MdxHeader";
